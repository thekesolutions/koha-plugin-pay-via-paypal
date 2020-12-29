const { dest, series, src } = require('gulp');

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
 * Set any of this two variables to null to disable vue build
 */

const api_namespace = 'paypal';
const vue_path = 'src';
/**
 * 
 * Array of directories relative to pm_bundle_path where static files will be served
 * 
 * If no static files need to be served, set static_relative_path = []
 * 
 */
const static_relative_path = ['schema', 'locales'];

var static_absolute_path = [];

if(static_relative_path.length) {
    static_absolute_path = static_relative_path.map(dir=>path.join(pm_bundle_path, dir)+'/**/*');
}

console.log(release_filename);
console.log(pm_file_path_full_dist);

function vue() {
    if(!api_namespace || !vue_path) return;
    static_relative_path.push('_nuxt');
    static_absolute_path = static_relative_path.map(dir=>path.join(pm_bundle_path, dir)+'/**/*');
    return run(`
        rm -rf ${vue_path}/dist ${pm_bundle_path}/_nuxt;
        echo '{"path": "/api/v1/contrib/${api_namespace}"}' > ${vue_path}/koha-api.json;
        cd ${vue_path};
        npm i;
        API_URL="/" npm run build;
        cd ..;
        sed -i -e "s/<\\/body>/\\[% INCLUDE 'intranet-bottom.inc' %\\]/g" ${vue_path}/dist/200.html;
        cp ${vue_path}/dist/200.html ${pm_bundle_path}/configure.tt
        cp -r ${vue_path}/dist/api/v1/contrib/${api_namespace}/static/_nuxt ${pm_bundle_path}
    `).exec()
};

function static( cb ) {
    if(static_absolute_path.length) {
        const tags = ['pluginStatic'];
        if(api_namespace) tags.push(api_namespace)
        let spec_body = JSON.stringify({
            get: {
                'x-mojo-to': 'Static#get',
                tags: tags,
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

        return src(static_absolute_path)
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
            .pipe(dest(pm_bundle_path));
    }
    else {
        return cb();
    }
};

function package() {
    return run(`
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

exports.static  = static;
exports.vue     = vue;
exports.package = package;
exports.vue_static = series( vue, static );
exports.build   = series( vue, static, package );
