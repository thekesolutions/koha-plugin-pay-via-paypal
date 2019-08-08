const po2json = require('po2json');
const fs = require('fs');
const path = require('path');
const { Readable, Transform, Writable } = require('stream');
const dir = '/home/agustin/git/koha/misc/translator/po';
const dest = '/home/agustin/git/koha-plugin-pay-via-paypal/Koha/Plugin/Com/Theke/PayViaPayPal/i18n';

const domains = ['marc-MARC21', 'marc-NORMARC', 'marc-UNIMARC', 'messages', 'opac-bootstrap', 'pref', 'staff-prog'];
const rgx = new RegExp('(.+)-('+domains.join('|')+').po');

const tokens = {
    home_breadcrumb:"Home",
    your_payment_breadcrumb:"Your Payment",
    error: "Error",
    error_title: "there was a problem processing your payment",
    PAYPAL_UNABLE_TO_CONNECT: "Unable to connect to PayPal.",
    PAYPAL_TRY_LATER: "Please try again later.",
    PAYPAL_ERROR_PROCESSING: "Unable to verify payment.",
    PAYPAL_CONTACT_LIBRARY:"Please contact the library to verify your payment.",
    PAYPAL_ERROR_STARTING: "Unable to start your payment.",
    return: "Return to fine details",
};

const langs = {};

const dir_stream = new Readable({
    read(size) {
        if(!this.files) {
            try {
                this.files = fs.readdirSync(dir);
            } catch(e) {
                console.log(err);
                process.nextTick(() => this.emit('error', err));
            }
        }
        let next = false;
        process.nextTick(() => {
            do {
                if(!this.files.length) {
                    console.log('fin de archivos');
                    this.push(null);
                    break;
                }
                next = this.push(this.files.pop());
            } while(next);
        })
    }
});

const filter_file = new Transform({
    transform(file, encoding, callback) {
        fs.stat(path.join(dir, file.toString()), (err, stat) => {
            if(err) return callback(err);
            if(stat.isDirectory()) return callback();
            callback(null, file);
        })
    }
});

const set_langs = new Transform({
    readableObjectMode: true,
    transform(file, encoding, callback) {
        this.langs = this.langs||{};
        const results = file.toString().match(rgx);
        if(!results) return callback('No se pudo obtener el lenguaje de '+file);
        this.langs[results[1]] = this.langs[results[1]]||[];
        this.langs[results[1]].push(file.toString());
        callback();
    },
    flush(callback) {
        console.log('flusheando');
        for(lang in this.langs) {
            let l = {lang, files: this.langs[lang]};
            console.log(l);
            this.push(l);
        }
        callback();
    }
});

const read_po = new Transform({
    objectMode: true,
    transform(lang, encoding, callback) {
        const errors = [];
        lang.translations = {};
        lang.files.forEach((file) => {
            try {
                let parsed = po2json.parseFileSync(path.join(dir, file), {format: 'mf'});
                Object.assign(lang.translations, parsed);
            } catch(e) {
                errors.push(e);
            }
        });
        if(errors.length) return process.nextTick(() => { callback(errors.join('\n\n')) });
        process.nextTick(() => { callback(null, lang) });
    }
});

const translate = new Transform({
    objectMode: true,
    transform(lang, encoding, callback) {
        lang.translated = {}
        for(let key in tokens) {
            lang.translated[key] = lang.translations[tokens[key]]||tokens[key];
        }
        process.nextTick(() => { callback(null, lang) });
    }
});

const write_file = new Writable({
    objectMode: true,
    write(lang, encoding, callback) {
        let trbody = Object.keys(lang.translated)
            .map(key=>'\t\t\t'+key+' = "'+lang.translated[key]+'"')
            .join('\n');
        let content = '/*\n\t[%\n\t\tTOKENS = {\n'+trbody+'\n\t\t}\n\t%]\n*/';
        let dst_file = path.join(dest, lang.lang+'.inc');
        process.nextTick(() => { fs.writeFileSync(dst_file, content) });
        callback();
    }
});

dir_stream
    .pipe(filter_file)
    .pipe(set_langs)
    .pipe(read_po)
    .pipe(translate)
    .pipe(write_file);

