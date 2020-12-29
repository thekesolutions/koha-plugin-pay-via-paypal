# Koha Plugin - Pay via PayPal

This plugin adds PayPal payments to the OPAC interface.

## Downloading

From the [release page](https://gitlab.com/thekesolutions/plugins/koha-plugin-pay-via-paypal/-/releases) you can download the relevant *.kpz file

## Installing

The plugin system needs to be turned on by a system administrator.

To set up the Koha plugin system you must first make some changes to your install.

* Change `<enable_plugins>0<enable_plugins>` to `<enable_plugins>1</enable_plugins>` in your koha-conf.xml file
* Confirm that the path to `<pluginsdir>` exists, is correct, and is writable by the web server
* Flush the memcached cache, and restart your instance's Plack service

```shell
systemctl restart memcached
```

On the staff interface, go to _Koha administration > Manage plugins_ and use the _Upload plugin_ button to upload the _.kpz_ file
you got in the _Downloading_ section.

Once the plugin has been uploaded, you will see it listed on the plugins table. But you need to restart Plack to get it working properly

```shell
koha-plack --restart <instance>
```

In the above command, `<instance>` refers to the Koha instance name.
## Configuration

To configure the plugin, you need to use the _Actions_ dropdown button on the plugins table, and choose _Configure_.
