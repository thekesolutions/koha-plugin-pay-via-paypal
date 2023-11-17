$(document).ready(function () {
    var input = $('input[value="Koha::Plugin::Com::Theke::PayViaPayPal"]');
    if ( input ) {
        var a = $('PAYPAL_IMAGE');
        input.parent().append(a);
        let txts = input.parent()
            .contents()
            .toArray()
        let txt = txts.find(item => {
            return item.nodeType === item.TEXT_NODE && item.nodeValue && item.nodeValue.trim() !== ''
        })
        if (txt) txt.parentNode.removeChild(txt);
    }
});
