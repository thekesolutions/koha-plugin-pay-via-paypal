$(document).ready(function () {
    var input = $('input[value="Koha::Plugin::Com::Theke::PayViaPayPal"]');
    if ( input ) {
        var a = $('<a href="https://www.paypal.com/webapps/mpp/paypal-popup" title="PayPal" class="paypal"><img src="https://www.paypalobjects.com/webstatic/mktg/logo/AM_SbyPP_mc_vs_dc_ae.jpg" alt="PayPal Acceptance Mark" border="0"><a>');
        input.parent().append(a);
        let txts = input.parent()
            .contents()
            .toArray()
        let txt = txts.find(item => {
            return item.nodeType === item.TEXT_NODE && item.nodeValue && item.nodeValue.trim() !== ''
        })
        txt.parentNode.removeChild(txt);
    }
});
