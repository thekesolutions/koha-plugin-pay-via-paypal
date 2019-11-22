package Koha::Plugin::Com::Theke::PayViaPayPal::ConfController;

# This file is part of Koha.
#
# Koha is free software; you can redistribute it and/or modify it under the
# terms of the GNU General Public License as published by the Free Software
# Foundation; either version 3 of the License, or (at your option) any later
# version.
#
# Koha is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along
# with Koha; if not, write to the Free Software Foundation, Inc.,
# 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

use Modern::Perl;

use Koha::Plugin::Com::Theke::PayViaPayPal;

use Mojo::Base 'Mojolicious::Controller';

use Try::Tiny;

use Mojo::JSON;

my $paypal = Koha::Plugin::Com::Theke::PayViaPayPal->new;

=head1 API

=head2 Class Methods

=head3 get_confs

Get configurations

=cut

sub get_confs {

    my $c = shift->openapi->valid_input or return;

    return try {
        my @configs = $paypal->_fetch_confs;
        my $sandbox = $paypal->retrieve_data('PayPalSandboxMode');

        my $response = {};
        my @filtered_confs;
        foreach my $conf (@configs) {
            foreach my $key (keys %$conf) {
                $conf->{$key} = $conf->{$key}?Mojo::JSON->true:Mojo::JSON->false if $key eq 'active';
                warn "$key ".$conf->{$key};
                delete $conf->{$key} unless defined $conf->{$key}
            }
            push @filtered_confs, $conf;
        }
        $response->{libraries} = \@filtered_confs if scalar(@filtered_confs);

        $response->{general} = {PayPalSandboxMode => $sandbox?Mojo::JSON->true:Mojo::JSON->false} if defined $sandbox;
    
        return $c->render( status => 200, openapi => $response );
    }
    catch {
        return $c->render( status => 500, openapi => { error => 'Something went wrong' } );
    }
}

=head3 set_genelar

Set general configurations

=cut

sub set_genelar {

    my $c = shift->openapi->valid_input or return;

    my $general = $c->validation->param('general');

    return try {
        $general->{PayPalSandboxMode} = $general->{PayPalSandboxMode}?1:0;
        $paypal->store_data($general);

        return $c->render( status => 200, openapi => {general => "General configurations saved"} );
    }
    catch {
        return $c->render( status => 500, openapi => { error => 'Something went wrong' } );
    }
}

=head3 set_libraries

Set library configurations

=cut

sub set_libraries {

    my $c = shift->openapi->valid_input or return;

    my $libConfs = $c->validation->every_param('libConfs');

    return try {
        $paypal->_process_confs({ rows => $libConfs });

        return $c->render( status => 200, openapi => {general => "Library configurations saved"} );
    }
    catch {
        warn $_->message;
        return $c->render( status => 500, openapi => { error => 'Something went wrong' } );
    }
}

1;
