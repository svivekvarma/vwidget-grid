
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node/CommonJS
        module.exports = function (root, jQuery) {
            if (jQuery === undefined) {
                // require('jQuery') returns a factory that requires window to
                // build a jQuery instance, we normalize how we use modules
                // that require this pattern but the window provided is a noop
                // if it's defined (how jquery works)
                if (typeof window !== 'undefined') {
                    jQuery = require('jquery');
                }
                else {
                    jQuery = require('jquery')(root);
                }
            }
            factory(jQuery);
            return jQuery;
        };
    } else {
        // Browser globals
        factory(jQuery);
    }
} (function ($) {

    $.widget("vwidgets.grid", {
        options: {
            data: [],
            emptyDataMessage: "No data available to show",
            css: {
                table: "grid",
                tablestyle: "",
                tdstyle: "",
                tdclass: "",
                trstyle: "",
                trclass: ""
            },
            headerTemplate: [],
            fieldTemplate: [],
            hidefields: [],
            showOnlyMode: false,
            showOnlyFields: [],
            keyfields: [],
            amalgateColumns: [],
            datefields: [],
            datetimefields: [],
            rowEvents: function () { },
            showPagination: true,
            paginationPageSize: 5,
            pageSize: 5,
            showSearchOption: false,
            showPrintOption: false,
            showCsvOption: false,
            showExportOptions: false,
            dataconfiguration: {}
        },
        _privateData: {
            renderedPagination: false,
            currentPage: 1
        },
        _create: function () {
            this.element._addClass("vwidgetsgrid");
            this.refresh();
        },
        _setOption: function (key, value) {
            if (key === "data") {
                // do something when data is set
            }
            this._super(key, value);
        },
        _setOptions: function (options) {
            this._super(options);
            this.refresh();
        },
        refresh: function () {

        },
        _destroy: function () {
           this.element.html('');
        }
    });
}));