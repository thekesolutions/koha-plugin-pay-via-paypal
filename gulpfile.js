const gulp = require('gulp');
const release = require('gulp-github-release');
const fs = require('fs');
const run = require('gulp-run');
const dateTime = require('node-datetime');
const Vinyl = require('vinyl');
const path = require('path');
const stream = require('stream');

const dt = dateTime.create();
const today = dt.format('Y-m-d');

const package_json = require('./package');
const release_filename = `${package_json.name}-v${package_json.version}.kpz`;

const pm_name = 'PayViaPayPal';
const pm_file = pm_name+'.pm';
const pm_file_path = path.join('Koha', 'Plugin', 'Com', 'Theke');
const pm_file_path_full = path.join(pm_file_path, pm_file);
const pm_file_path_dist = path.join('dist', pm_file_path);
const pm_file_path_full_dist = path.join(pm_file_path_dist, pm_file);
const pm_bundle_path = path.join(pm_file_path, pm_name);

/**
 * 
 * Array of directories relative to pm_bundle_path where static files will be served
 * 
 * If no static files need to be served, set static_relative_path = []
 * 
 */
const static_relative_path = ['schema'];

var static_absolute_path = [];

if(static_relative_path.length) {
    static_absolute_path = static_relative_path.map(dir=>path.join(pm_bundle_path, dir)+'/**/*');
}

console.log(release_filename);
console.log(pm_file_path_full_dist);

gulp.task('vue', ()=>{
    if(!package_json.api_namespace) return;
    var vue_path = path.join('.', package_json.vue_path||'src');
    static_relative_path.push('_nuxt');
    static_absolute_path = static_relative_path.map(dir=>path.join(pm_bundle_path, dir)+'/**/*');
    return run(`
        rm -rf ${vue_path}/dist ${pm_bundle_path}/_nuxt;
        echo '{"path": "/api/v1/contrib/${package_json.api_namespace}/static/_nuxt"}' > ${vue_path}/koha-api.json;
        cd ${vue_path};
        npm i;
        API_URL="/" npm run build;
        cd ..;
        sed -i -e "s/<\\/body>/\\[% INCLUDE 'intranet-bottom.inc' %\\]/g" ${vue_path}/dist/200.html;
        cp ${vue_path}/dist/200.html ${pm_bundle_path}/configure.tt
        cp -r ${vue_path}/dist/api/v1/contrib/${package_json.api_namespace}/static/_nuxt ${pm_bundle_path}
    `).exec()
})

gulp.task('static', ['vue'], ()=>{
    if(static_absolute_path.length) {
        let spec_body = JSON.stringify({
            get: {
                'x-mojo-to': 'Static#get',
                tags: ['pluginStatic'],
                responses: {
                    200: {
                        description: 'File found',
                        schema: {
                            type: 'file'
                        }
                    },
                    404: {
                        description: 'File not found',
                        schema: {
                            type: 'object',
                            properties: {
                                error: {
                                    description: "An explanation for the error",
                                    type: "string"
                                }
                            }
                        }
                    },
                    400: {
                        description: 'Bad request',
                        schema: {
                            type: 'object',
                            properties: {
                                error: {
                                    description: "An explanation for the error",
                                    type: "string"
                                }
                            }
                        }
                    },
                    500: {
                        description: 'Internal server error',
                        schema: {
                            type: 'object',
                            properties: {
                                error: {
                                    description: "An explanation for the error",
                                    type: "string"
                                }
                            }
                        }
                    }
                }
            }
        }, null, 2);

        return gulp.src(static_absolute_path)
            .pipe(new stream.Transform({
                objectMode: true,
                transform: (file, unused, cb) => {
                    if(file.stat.isDirectory()) return cb();
                    let path_name = path.join('/', path.relative(pm_bundle_path, file.base), file.relative);
                    console.log('creating '+path_name);
                    let endpoint_spec = '"'+path_name+'": '+ spec_body;
                    file.contents = Buffer.from(endpoint_spec);
                    cb(null, file);
                }
            }))
            .pipe(new stream.Transform({
                objectMode: true,
                transform: function(file, unused, cb) {
                    !this.bufArray && (this.bufArray = []);
                    this.bufArray.push(file.contents);
                    cb();
                }
            }))
            .on('finish', function() {
                let file = new Vinyl({
                    path: 'staticapi.json',
                    contents: Buffer.from('{\n'+this.bufArray.map(buf=>buf.toString()).join(',\n')+'\n}')
                });
                this.emit('data', file);
                this.end();
            })
            .pipe(gulp.dest(pm_bundle_path));
    }
});

const build = () => {
    run(`
        mkdir dist ;
        cp -r Koha dist/. ;
        sed -i -e "s/{VERSION}/${package_json.version}/g" ${pm_file_path_full_dist} ;
        sed -i -e "s/1900-01-01/${today}/g" ${pm_file_path_full_dist} ;
        cd dist ;
        zip -r ../${release_filename} ./Koha ;
        cd .. ;
        rm -rf dist ;
    `).exec();

};

gulp.task('build', ['static'], build);

gulp.task('build:perl', build);

gulp.task('release', () => {
    gulp.src(release_filename)
        .pipe(release({
            manifest: require('./package.json') // package.json from which default values will be extracted if they're missing
        }));
});
