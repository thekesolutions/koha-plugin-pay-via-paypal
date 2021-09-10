package Koha::Plugin::Com::Theke::PayViaPayPal;

## It's good practice to use Modern::Perl
use Modern::Perl;

## Required for all plugins
use base qw(Koha::Plugins::Base);

## We will also need to include any Koha libraries we want to access
use C4::Context;
use C4::Output;
use C4::Auth qw(get_template_and_user);
use C4::Languages;
use Koha::Patron;
use Koha::DateUtils;
use Koha::Libraries;
use Koha::Patron::Categories;
use Koha::Account;
use Koha::Account::Lines;
use MARC::Record;
use Cwd qw(abs_path);
use Mojo::JSON qw(decode_json);
use URI;
use HTTP::Request::Common;
use URI::Escape qw(uri_unescape);
use LWP::UserAgent;

## Here we set our plugin version
our $VERSION = "{VERSION}";

## Here is our metadata, some keys are required, some are optional
our $metadata = {
    name            => 'Pay Via PayPal',
    author          => 'Agustín Moyano',
    date_authored   => '2019-06-13',
    date_updated    => "1900-01-01",
    minimum_version => '19.11.00.000',
    maximum_version => undef,
    version         => $VERSION,
    description     => 'This plugin implements payment method via PayPal',
};

## This is the minimum code required for a plugin's 'new' method
## More can be added, but none should be removed
sub new {
    my ( $class, $args ) = @_;

    ## We need to add our metadata here so our base class can access it
    $args->{'metadata'} = $metadata;
    $args->{'metadata'}->{'class'} = $class;

    ## Here, we call the 'new' method for our base class
    ## This runs some additional magic and checking
    ## and returns our actual $self
    my $self = $class->SUPER::new($args);

    return $self;
}

## If your plugin can process payments online,
## and that feature of the plugin is enabled,
## this method will return true
sub opac_online_payment {
    my ( $self, $args ) = @_;

    my $library_id = C4::Context->userenv->{branch};

    my $conf = $self->_get_conf({ library_id => $library_id });
    
    return defined $conf->{user} && defined $conf->{pwd} && defined $conf->{signature};
}

## This method triggers the beginning of the payment process
## It could result in a form displayed to the patron the is submitted
## or go straight to a redirect to the payment service ala paypal
sub opac_online_payment_begin {
    my ( $self, $args ) = @_;
    my $cgi = $self->{'cgi'};

    my $active_currency = Koha::Acquisition::Currencies->get_active;

    my $error = 0;

    my $ua = LWP::UserAgent->new;

    my ( $template, $borrowernumber, $cookie ) = get_template_and_user(
        {   template_name   => $self->mbf_path( 'opac_online_payment_error.tt' ),
            query           => $cgi,
            type            => 'opac',
            authnotrequired => 0,
            is_plugin       => 1,
        }
    );

    my $lang = C4::Languages::getlanguage($cgi);
    my @lang_split = split /_|-/, $lang;

    $template->param( 
        lang_dialect => $lang,
        lang_all => $lang_split[0],
        plugin_dir => $self->bundle_path
    );

    my $library_id = C4::Context->userenv->{branch};
    my $conf = $self->_get_conf({ library_id => $library_id });

    my $url =
      $self->retrieve_data('PayPalSandboxMode')
      ? 'https://api-3t.sandbox.paypal.com/nvp'
      : 'https://api-3t.paypal.com/nvp';

    my $opac_base_url = C4::Context->preference('OPACBaseURL');

    my @accountline_ids = $cgi->multi_param('accountline');

    my $rs = Koha::Database->new()->schema()->resultset('Accountline');
    my @accountlines = map { $rs->find($_) } @accountline_ids;

    my $amount_to_pay = 0;
    
    foreach $a (@accountlines) {
        $amount_to_pay = $amount_to_pay + $a->amountoutstanding;
    }
    
    my $return_url = URI->new( $opac_base_url . "/cgi-bin/koha/opac-account-pay-return.pl" );
    $return_url->query_form( { amount => $amount_to_pay, accountlines => \@accountlines, payment_method => 'Koha::Plugin::Com::Theke::PayViaPayPal' } );

    my $cancel_url = URI->new( $opac_base_url . "/cgi-bin/koha/opac-account.pl" );

    my $nvp_params = {
        'USER'      => $conf->{user},
        'PWD'       => $conf->{pwd},
        'SIGNATURE' => $conf->{signature},

        # API Version and Operation
        'METHOD'  => 'SetExpressCheckout',
        'VERSION' => '82.0',

        # API specifics for SetExpressCheckout
        'NOSHIPPING'                            => 1,
        'REQCONFIRMSHIPPING'                    => 0,
        'ALLOWNOTE'                             => 0,
        'BRANDNAME'                             => C4::Context->preference('LibraryName'),
        'CANCELURL'                             => $cancel_url->as_string(),
        'RETURNURL'                             => $return_url->as_string(),
        'PAYMENTREQUEST_0_CURRENCYCODE'         => $active_currency->currency,
        'PAYMENTREQUEST_0_AMT'                  => $amount_to_pay,
        'PAYMENTREQUEST_0_PAYMENTACTION'        => 'Sale',
        'PAYMENTREQUEST_0_ALLOWEDPAYMENTMETHOD' => 'InstantPaymentOnly',
        'PAYMENTREQUEST_0_DESC'                 => $conf->{charge_description},
        'SOLUTIONTYPE'                          => 'Sole',
    };

    my $response = $ua->request( POST $url, $nvp_params );

    if ( $response->is_success ) {

        my $urlencoded = $response->content;
        my %params = URI->new( "?$urlencoded" )->query_form;

        if ( $params{ACK} eq "Success" ) {
            my $token = $params{TOKEN};

            my $redirect_url =
              $self->retrieve_data('PayPalSandboxMode')
              ? "https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token="
              : "https://www.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=";
            print $cgi->redirect( $redirect_url . $token );

        }
        else {
            $template->param( error_token => "PAYPAL_ERROR_STARTING" );
            $error = 1;
        }

    }
    else {
        $template->param( error_token => "PAYPAL_UNABLE_TO_CONNECT" );
        $error = 1;
    }

    output_html_with_http_headers( $cgi, $cookie, $template->output, undef, { force_no_caching => 1 } ) if $error;

}

## This method triggers the end of the payment process
## Should should result in displaying a page indicating
## the success or failure of the payment.
sub opac_online_payment_end {
    my ( $self, $args ) = @_;
    my $cgi = $self->{'cgi'};
    
    my ( $template, $borrowernumber, $cookie ) = get_template_and_user(
        {   template_name   => $self->mbf_path( 'opac_online_payment_error.tt' ),
            query           => $cgi,
            type            => 'opac',
            authnotrequired => 0,
            is_plugin       => 1,
        }
    );

    my $lang = C4::Languages::getlanguage($cgi);
    my @lang_split = split /_|-/, $lang;

    $template->param( 
        lang_dialect => $lang,
        lang_all => $lang_split[0],
        plugin_dir => $self->bundle_path
    );

    my $active_currency = Koha::Acquisition::Currencies->get_active;

    my $token    = $cgi->param('token');
    my $payer_id = $cgi->param('PayerID');
    my $amount   = $cgi->param('amount');
    my @accountlines = $cgi->multi_param('accountlines');

    my $ua = LWP::UserAgent->new;

    my $url =
      $self->retrieve_data('PayPalSandboxMode')
      ? 'https://api-3t.sandbox.paypal.com/nvp'
      : 'https://api-3t.paypal.com/nvp';

    my $library_id = C4::Context->userenv->{branch};
    my $conf = $self->_get_conf({ library_id => $library_id });      

    my $nvp_params = {
        'USER'      => $conf->{user},
        'PWD'       => $conf->{pwd},
        'SIGNATURE' => $conf->{signature},

        # API Version and Operation
        'METHOD'  => 'DoExpressCheckoutPayment',
        'VERSION' => '82.0',

        # API specifics for DoExpressCheckout
        'PAYMENTREQUEST_0_PAYMENTACTION' => 'Sale',
        'PAYERID'                        => $payer_id,
        'TOKEN'                          => $token,
        'PAYMENTREQUEST_0_AMT'           => $amount,
        'PAYMENTREQUEST_0_CURRENCYCODE'  => $active_currency->currency,
    };

    my $response = $ua->request( POST $url, $nvp_params );

    my $error = q{};
    if ( $response->is_success ) {

        my $urlencoded = $response->content;
        my %params = URI->new( "?$urlencoded" )->query_form;


        if ( $params{ACK} eq "Success" ) {
            $amount = $params{PAYMENTINFO_0_AMT};

            my $account = Koha::Account->new( { patron_id => $borrowernumber } );
            my @lines = Koha::Account::Lines->search(
                {
                    accountlines_id => { -in => \@accountlines }
                }
            );

            $account->pay(
                {
                    amount => $amount,
                    lines  => \@lines,
                    note   => 'PayPal',
                    interface => C4::Context->interface
                }
            );
            print $cgi->redirect("/cgi-bin/koha/opac-account.pl?payment=$amount")
        }
        else {
            $template->param( error_token => "PAYPAL_ERROR_PROCESSING" );
            $error = 1;
        }

    }
    else {
        $template->param( error_token => "PAYPAL_UNABLE_TO_CONNECT" );
        $error = 1;
    }

    
    output_html_with_http_headers( $cgi, $cookie, $template->output, undef, { force_no_caching => 1 } ) if $error;
}

sub opac_online_payment_threshold {
    my ( $self, $args ) = @_;
    my $library_id = C4::Context->userenv->{branch};
    my $conf = $self->_get_conf({ library_id => $library_id });
    return $conf->{threshold}||0;
}

## If your tool is complicated enough to needs it's own setting/configuration
## you will want to add a 'configure' method to your plugin like so.
## Here I am throwing all the logic into the 'configure' method, but it could
## be split up like the 'report' method is.
sub configure {
    my ( $self, $args ) = @_;

    my $template = $self->get_template({ file => 'configure.tt' });
    $self->output_html( $template->output() );
}

sub install {
    my ( $self, $args ) = @_;

    my $table = $self->get_qualified_table_name('pay_via_paypal');

    C4::Context->dbh->do(qq{
        CREATE TABLE IF NOT EXISTS $table (
            `id`                    INT(11) NOT NULL AUTO_INCREMENT,
            `library_id`            VARCHAR(10) DEFAULT NULL,
            `active`                BOOLEAN DEFAULT TRUE,
            `user`                  VARCHAR(250) DEFAULT NULL,
            `pwd`                   VARCHAR(250) DEFAULT NULL,
            `signature`             VARCHAR(250) DEFAULT NULL,
            `charge_description`    VARCHAR(250) DEFAULT NULL,
            `threshold`             INT(11) DEFAULT 0,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    });

}

sub uninstall() {
    my ( $self, $args ) = @_;

    my $table = $self->get_qualified_table_name('pay_via_paypal');

    return C4::Context->dbh->do("DROP TABLE IF EXISTS $table");
}

sub _get_conf {
    my ( $self, $args ) = @_;

    my $library_id = $args->{library_id};

    my $table = $self->get_qualified_table_name('pay_via_paypal');

    my $query = qq{
        select  coalesce(l.active, d.active) as active,
                coalesce(l.user, d.user) as user,
                coalesce(l.pwd, d.pwd) as pwd,
                coalesce(l.signature, d.signature) as signature,
                coalesce(l.charge_description, d.charge_description) as charge_description,
                coalesce(l.threshold, d.threshold) as threshold
        from    (
                select 1 as _order, active, user, pwd, signature, charge_description, threshold from $table where library_id is null
                union
                select 2, null, null, null, null, null, null
                order by 1
                limit 1
                ) d
        cross join
                (
                select 1 as _order, active, user, pwd, signature, charge_description, threshold from $table where library_id = ?
                union
                select 2, null, null, null, null, null, null
                order by 1
                limit 1
                ) l
        where   d.active = 1 or l.active = 1
    };

    my $sth = C4::Context->dbh->prepare($query);
    $sth->execute($library_id);
    return $sth->fetchrow_hashref()
}

sub _fetch_confs {
    my ( $self, $args ) = @_;

    my $table = $self->get_qualified_table_name('pay_via_paypal');
    my $query = qq{
        SELECT * FROM $table
    };
    my $sth = C4::Context->dbh->prepare($query);
    $sth->execute();
    my @results;
    while ( my $row = $sth->fetchrow_hashref() ) {
        push( @results, $row );
    }
    return @results;
}

sub _process_confs {
    my ( $self, $args ) = @_;

    my $table = $self->get_qualified_table_name('pay_via_paypal');

    my $rows = $args->{rows};

    foreach my $row (@$rows) {
        my $sth = C4::Context->dbh->prepare(qq{
            SELECT id FROM $table where library_id = ? or (library_id is null and ? is null)
        });

        $sth->execute($row->{library_id}||undef, $row->{library_id}||undef);

        my $exists = $sth->fetchrow_hashref();

        if($exists) {
            C4::Context->dbh->do(qq{
                UPDATE $table 
                SET active = ?,
                    user = ?,
                    pwd = ?,
                    signature = ?,
                    charge_description = ?,
                    threshold = ?
                WHERE id = ?
            }, undef, $row->{active}?1:0, $row->{user}||undef, $row->{pwd}||undef, $row->{signature}||undef, $row->{charge_description}||undef, $row->{threshold}||undef, $exists->{id});
        } else {
            C4::Context->dbh->do(qq{
                INSERT INTO $table (library_id, active, user, pwd, signature, charge_description, threshold)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            }, undef, $row->{library_id}||undef, $row->{active}?1:0, $row->{user}||undef, $row->{pwd}||undef, $row->{signature}||undef, $row->{charge_description}||undef, $row->{threshold}||undef);
        }
    }
}

sub api_routes {
    my ( $self, $args ) = @_;

    my $spec_str = $self->mbf_read('openapi.json');
    my $spec     = decode_json($spec_str);

    return $spec;
}

sub api_namespace {
    my ( $self ) = @_;
    
    return 'paypal';
}

sub static_routes {
    my ( $self, $args ) = @_;

    my $spec_str = $self->mbf_read('staticapi.json');
    my $spec     = decode_json($spec_str);

    return $spec;
}

1;
