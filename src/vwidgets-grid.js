
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

    $.widget("vwidgets.vgrid", {
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
            amalgateColumns: [],
            datefields: [],
            datetimefields: [],
            rowEvents: function () { },
            showPagination: true,
            paginationPageSize: 5,
            pageSize: 5,
            showSearchOption: true,
            showPrintOption: true,
            showCsvOption: true,
            showExportOptions: true
        },
        _privateData: {
            renderedPagination: false,
            currentPage: 1,
            currentBlock: 1,
            totalPages: 0,
            totalBlocks: 0,
            dataconfiguration: {},
            headers: []
        },
        _create: function () {
            this.element.addClass("vwidgetsgrid");

            console.log(this.options);
            this._privateData.originalData = this.options.data;
            this._renderDeskTop();
        },
        _setOption: function (key, value) {
            if (key === "data") {
                if (this._privateData.renderedPagination) {
                    this._renderPagination();
                    this._renderRows();
                }
                // do something when data is set
            }
            this._super(key, value);
        },
        _setOptions: function (options) {
            this._super(options);
            this.refresh();
        },
        _renderDeskTop: function () {
            this._extractHeaders();
            console.log(this._privateData.headers);
            if (this._privateData.headers.length > 0) {
                if (this.options.showPagination) {
                    this._renderPagination();
                }
                var arrHTML = [];
                if (this.options.showSearchOption) {

                    arrHTML.push('<div class="searchsection"><label>Search </label><input type="search" class="searchtextfield" placeholder="Filter your results by typing search text"/></div>');
                    //arrHTML.push('<div class="clearboth"></div>');
                }
                if (this.options.showPrintOption || this.options.showExportOptions) {
                    arrHTML.push('<div class="exportoptions">');
                    if (this.options.showPrintOption) {
                        arrHTML.push('<div class="icon printicon">');

                        arrHTML.push('</div>');
                    }
                    if (this.options.showCsvOption) {
                        arrHTML.push('<div class="icon downloadicon">');

                        arrHTML.push('</div>');
                    }
                    arrHTML.push('</div>');
                }
                arrHTML = arrHTML.concat(this._generateTable());
                this.element.append(arrHTML.join(''));
                //check if overflow needs to be setup for grid container
                if (this.element.find('.' + this.options.css.table + '').width() > this.element.find('.gridcontainer').width()) {
                    this.element.find('.gridcontainer').css('overflow-x', 'scroll');
                }

                this._bindEvents();
                // Add event binding here
            }
        },
        _renderMobile: function () {

        },
        _extractHeaders: function () {
            if (!this.options.showOnlyMode) {
                var headers = [];
                if (this.options.data.length > 0) {
                    var obj = this.options.data[0];
                    for (var key in obj) {
                        if (obj.hasOwnProperty(key) && typeof obj[key] !== 'function') {
                            var result = $.grep(this.options.hidefields, function (a) {
                                return a.toLowerCase() === key.toLowerCase()
                            });
                            if (result.length === 0) {
                                headers.push(key);
                            }
                        }
                    }
                }
                this._privateData.headers = headers;
            } else {
                this._privateData.headers = this.options.showOnlyFields;
            }
        },
        _renderPagination: function () {

            if (this.options.showPagination) {
                var arrPagination = [];

                if (this.options.data.length <= 0) {
                    this.element.find('.tablerenderpagination').find('ul').html('');
                    return;
                }
                if (!this._privateData.renderedPagination) {
                    arrPagination.push('<div class=tablerenderpagination>');
                    arrPagination.push('<ul>');
                    arrPagination.push('</ul>');
                    arrPagination.push('</div>');
                    this.element.append(arrPagination.join(''));
                    arrPagination = [];
                }

                var totalpages = 1;
                if (this.options.data.length >= this.options.pageSize) {
                    totalpages = this.options.data.length / this.options.pageSize;
                }
                var totalblocks = 1;
                if (totalpages > this.options.paginationPageSize) {
                    totalblocks = totalpages / this.options.paginationPageSize;
                }
                this._privateData.totalPages = Math.ceil(totalpages);
                this._privateData.totalBlocks = Math.ceil(totalblocks);

                // render the page number based on block logic
                var startpage;
                var endpage;

                var result = this._calculateStartEndPage();
                startpage = result.startpage;
                endpage = result.endpage;

                // implied by situations where data is refreshed by deleting records go to last block and last page
                if (startpage > endpage) {
                    //this._privateData.currentBlock = this._privateData.totalBlocks - 1;
                    this._privateData.currentPage = this._privateData.totalPages - 1;
                    result = this._calculateStartEndPage();
                    startpage = result.startpage;
                    endpage = result.endpage;
                }

                arrPagination.push('<li class="paginationpage"><a>' + "<<" + '</a></li>');
                for (var i = startpage; i <= endpage; i++) {
                    if (i == startpage) {
                        arrPagination.push('<li class="paginationpage active"><a>' + i + '</a></li>');
                    } else {
                        arrPagination.push('<li class="paginationpage"><a>' + i + '</a></li>');
                    }
                }
                arrPagination.push('<li class="paginationpage"><a>' + ">>" + '</a></li>');
                this.element.find('.tablerenderpagination').find('ul').html(arrPagination.join(''));
                this._privateData.renderedPagination = true;
            }
        },
        _calculateStartEndPage: function () {

            // render the page number based on block logic
            var startpage;
            var endpage;

            if (this._privateData.totalPages - this._privateData.currentPage >= this.options.paginationPageSize) {
                startpage = this._privateData.currentPage;
                endpage = this._privateData.currentPage + (this.options.paginationPageSize - 1);
            } else {
                startpage = this._privateData.currentPage;
                endpage = this._privateData.totalPages;
                if (endpage === 0) {
                    endpage = startpage;
                }
            }

            return {startpage: startpage, endpage: endpage};
        },
        _generateTable: function (exportmode) {
            var arrHTML = [];
            arrHTML.push('<div class="gridcontainer">');
            arrHTML.push('<table class=\'' + this.options.css.table + '\'>');
            arrHTML.push(' <thead>');
            if ((this._privateData.headers.length > 0 || this.options.amalgateColumns.length > 0) && this.options.data.length > 0) {

                if (this.options.amalgateColumns.length > 0) {
                    for (var i = 0; i < this.options.amalgateColumns.length; i++) {
                        if (this.options.amalgateColumns[i].prepend) {
                            arrHTML.push(' <th data-realname="amalgated">');
                            arrHTML.push(this.options.amalgateColumns[i].columnHeader);
                            arrHTML.push('</th>');
                        }
                    }
                }
                if (this._privateData.headers.length > 0) {
                    for (var i = 0; i < this._privateData.headers.length; i++) {
                        arrHTML.push(' <th data-realname="' + this._privateData.headers[i] + '">');
                        arrHTML.push(this._headerOutput(this._privateData.headers[i]));
                        arrHTML.push('<span class="sortindicator asc">&uarr;</span>');
                        arrHTML.push('<span class="sortindicator desc">&darr;</span>');
                        arrHTML.push('</th>');
                    }
                }

                if (this.options.amalgateColumns.length > 0) {
                    for (var i = 0; i < this.options.amalgateColumns.length; i++) {
                        if (!this.options.amalgateColumns[i].prepend) {
                            arrHTML.push(' <th data-realname="amalgated">');
                            arrHTML.push(this.options.amalgateColumns[i].columnHeader);
                            arrHTML.push('</th>');
                        }
                    }
                }


            } else {
                arrHTML.push(' <th>');
                arrHTML.push(this.options.emptyDataMessage);
                arrHTML.push('</th>');
            }

            arrHTML.push(' </thead>');
            arrHTML.push(' <tbody>');
            arrHTML = arrHTML.concat(this._getRowsHtml(exportmode));
            arrHTML.push(' </tbody>');
            arrHTML.push('</table>');
            arrHTML.push('</div>');
            return arrHTML;
        },
        _renderRows: function () {
            this.element.find('.' + this.options.css.table + ':first')
                .find('tbody:first')
                .html('');

            var html = this._getRowsHtml();

            this.element.find('.' + this.options.css.table + ':first')
                .find('tbody:first')
                .html(html.join(''));
        },
        _getRowsHtml: function (printmode) {

            arrHTML = [];

            // Pagination info is used to calculate which records to show
            var startrecord = 0,
                endrecord = 0;
            if (this.options.showPagination && !printmode) {

                var currentpage = this._privateData.currentPage,
                    currentpagesize = this.options.pageSize;

                startrecord = (currentpage) * currentpagesize - currentpagesize;
                if (startrecord < 0) {
                    startrecord = 0;
                }

                if (startrecord + currentpagesize > this.options.data.length) {
                    endrecord = this.options.data.length - 1;
                } else {
                    endrecord = startrecord + currentpagesize - 1;
                }
            } else {
                startrecord = 0;
                endrecord = this.options.data.length - 1;
            }
            if (this.options.data.length === 0) {
                var headers = this._privateData.headers;
                arrHTML.push(' <tr>');
                arrHTML.push(' <td colspan="' + headers.length + this.options.amalgateColumns.length + '" class="norecords">No records found for the search criteria</td>');
                arrHTML.push(' </tr>');
            }

            for (var i = startrecord; i <= endrecord; i++) {

                arrHTML.push(' <tr>');
                if (this.options.amalgateColumns.length > 0) {
                    for (var am = 0; am < this.options.amalgateColumns.length; am++) {
                        if (this.options.amalgateColumns[am].prepend) {
                            if (this.options.amalgateColumns[am].hasOwnProperty('style')) {
                                arrHTML.push('<td style="' + this.options.amalgateColumns[am].style + '">');
                            } else {
                                arrHTML.push('<td>');
                            }
                            arrHTML.push(this.options.amalgateColumns[am].template(this.options.data[i], i));
                            arrHTML.push('</td>');
                        }
                    }
                }

                for (var j = 0; j < this._privateData.headers.length; j++) {
                    arrHTML.push(' <td>');
                    arrHTML.push(this._fieldOutput(this.options.data[i][this._privateData.headers[j]], this._privateData.headers[j], this.options.data[i]));
                    arrHTML.push(' </td>');
                }

                if (this.options.amalgateColumns.length > 0) {
                    for (var am = 0; am < this.options.amalgateColumns.length; am++) {
                        if (!this.options.amalgateColumns[am].prepend) {
                            if (this.options.amalgateColumns[am].hasOwnProperty('style')) {
                                arrHTML.push('<td style="' + this.options.amalgateColumns[am].style + '">');
                            } else {
                                arrHTML.push('<td>');
                            }

                            arrHTML.push(this.options.amalgateColumns[am].template(this.options.data[i], i));
                            arrHTML.push('</td>');
                        }
                    }
                }
                arrHTML.push(' </tr>');
            }

            return arrHTML;

        },
        _headerOutput: function () {
            var field = arguments[0];
            if (this.options.headerTemplate.length > 0) {
                for (var i = 0; i < this.options.headerTemplate.length; i++) {
                    if (this.options.headerTemplate[i].fieldName.toLowerCase() === field.toLowerCase()) {
                        return this.options.headerTemplate[i].template(field);
                    }
                }
            }
            return field;
        },
        _fieldOutput: function () {
            var record = arguments[2];
            var fieldName = arguments[1];
            var field = arguments[0];
            if (this.options.fieldTemplate.length > 0) {
                for (var i = 0; i < this.options.fieldTemplate.length; i++) {
                    if (this.options.fieldTemplate[i].fieldName.toLowerCase() === fieldName.toLowerCase()) {
                        return this.options.fieldTemplate[i].template(field, record);
                    }
                }
            }

            if (this.options.datetimefields.length > 0) {
                for (var i = 0; i < this.options.datetimefields.length; i++) {
                    if (this.options.datetimefields[i].toLowerCase() === fieldName.toLowerCase()) {
                        if (!(field === null || field === undefined || field === '')) {
                            var date = new Date(parseInt(field.substr(6)));
                            return date.toLocaleString();
                        } else {
                            return '';
                        }
                    }
                }
            }

            if (this.options.datefields.length > 0) {
                for (var i = 0; i < this.options.datefields.length; i++) {
                    if (this.options.datefields[i].toLowerCase() === fieldName.toLowerCase()) {
                        if (!(field === null || field === undefined || field === '')) {
                            var date = new Date(parseInt(field.substr(6)));
                            return date.toLocaleDateString();
                        } else {
                            return '';
                        }

                    }
                }
            }
            return field;
        },
        _convertToCSV: function convertArrayOfObjectsToCSV(args) {
            var result, ctr, keys, columnDelimiter, lineDelimiter, data;
            data = this.options.data;

            if (data == null || !data.length) {
                return null;
            }

            columnDelimiter = columnDelimiter || ',';
            lineDelimiter = lineDelimiter || '\n';
            keys = Object.keys(data[0]);

            result = '';
            result += keys.join(columnDelimiter);
            result += lineDelimiter;

            data.forEach(function (item) {
                ctr = 0;
                keys.forEach(function (key) {
                    if (ctr > 0) result += columnDelimiter;

                    result += item[key];
                    ctr++;
                });
                result += lineDelimiter;
            });
            return result;
        },
        _customSort: function (property, type) {
            var sortOrder = 1;
            if (property[0] === "-") {
                sortOrder = -1;
                property = property.substr(1, property.length - 1);
            }
            if (type) {
                if (type === "string") {
                    return function (a, b) {
                        var result = (a[property].toLowerCase() < b[property].toLowerCase()) ? -1 : (a[property].toLowerCase() > b[property].toLowerCase()) ? 1 : 0;
                        return result * sortOrder;
                    }
                } else {
                    return function (a, b) {
                        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
                        return result * sortOrder;
                    }
                }
            } else {
                return function (a, b) {
                    var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
                    return result * sortOrder;
                }
            }
        },
        _sort: function () {
            var currentSort = this.element.find('th[data-realname=' + this._privateData.sortField + ']').attr('data-sortasc');
            this.element.find('th').removeAttr('data-sortasc');
            if (currentSort) {
                if (currentSort == "true") {
                    currentSort = "false";
                } else {
                    currentSort = "true";
                }
            } else {
                currentSort = "true";
            }
            var sortstring = currentSort == "true" ? "" : "-";
            this.options.data = this.options.data.sort(this._customSort(sortstring + this._privateData.sortField));
            this.element.find(' th[data-realname=' + this._privateData.sortField + ']').attr('data-sortasc', currentSort.toString());
            this._renderRows();
        },
        _searchText: function (searchtext) {
            if (searchtext === '' || searchtext === "") {
                this.options.data = this._privateData.originalData;
            } else {
                var filtereddata = [];
                for (var i = 0; i < this._privateData.originalData.length; i++) {
                    for (var property in this._privateData.originalData[i]) {
                        var tobebroken = false;
                        if (this._privateData.originalData[i].hasOwnProperty(property)) {

                            if (this._privateData.originalData[i][property] != null && this._privateData.originalData[i][property] != '' && this._privateData.originalData[i][property] != undefined) {
                                if (this._privateData.originalData[i][property].toString().toLowerCase().indexOf(searchtext.toLowerCase()) >= 0) {
                                    filtereddata.push(this._privateData.originalData[i]);
                                    tobebroken = true;
                                }
                            }
                            if (tobebroken)
                                break;
                        }
                    }
                }
                this.options.data = filtereddata;
            }

            this._renderPagination();
            this._renderRows();
        },
        _bindEvents: function () {

            // sort field binding

            this._on(this.element, {
                "click th": function (event) {
                    event.stopImmediatePropogation();
                    console.log(event);
                    if (!($(event.currentTarget).attr('data-realname') === "amalgated")) {
                        this._privateData.sortField = $(event.currentTarget).attr('data-realname');
                        this.element.find('.tablerenderpagination > ul > li').removeClass('active');
                        this._privateData.currentBlock = 1;
                        this._privateData.currentPage = 1;
                        this._renderPagination();
                        this._sort();
                    }
                }
            });

            // Bind Search events 

            this._on(this.element, {
                "keyup .searchtextfield": function (event) {
                    event.preventDefault();
                    console.log(event);
                    this._privateData.currentBlock = 1;
                    this._privateData.currentPage = 1;
                    this._searchText($(event.currentTarget).val());
                }
            });

            // Bind print events 


            this._on(this.element, {
                "click .printicon": function (event) {
                    event.preventDefault();
                    console.log(event);
                    var arrHtml = this._generateTable(true);
                    arrHtml.splice(0, 0, "<link href='tablerender.css' rel='stylesheet' media='all'/>");
                    var printWin = window.open("");
                    printWin.document.write(arrHtml.join(''));
                    setTimeout(function () {
                        printWin.print();
                        printWin.close();
                    }, 100);
                }
            });

            // Bind csv events 

            this._on(this.element, {
                "click .downloadicon": function (event) {
                    event.preventDefault();
                    console.log(event);
                    var data, link;
                    var csv = this._convertToCSV();
                    if (csv == null) return;
                    filename = 'export.csv';

                    //if (!csv.match(/^data:text\/csv/i)) {
                    //    csv = 'data:text/csv;charset=utf-8,' + csv;
                    //}
                    //data = encodeURI(csv);

                    var a = document.createElement('a');
                    var mimeType = 'application/octet-stream';

                    if (navigator.msSaveBlob) { // IE10
                        return navigator.msSaveBlob(new Blob([csv], {
                            type: mimeType
                        }), filename);
                    } else if ('download' in a) { //html5 A[download]
                        a.href = 'data:' + mimeType + ',' + encodeURIComponent(csv);
                        a.setAttribute('download', filename);
                        document.body.appendChild(a);
                        setTimeout(function () {
                            a.click();
                            document.body.removeChild(a);
                        }, 66);
                        return true;
                    } else { //do iframe dataURL download (old ch+FF):
                        var f = document.createElement('iframe');
                        document.body.appendChild(f);
                        f.src = 'data:' + mimeType + ',' + encodeURIComponent(csv);
                        setTimeout(function () {
                            document.body.removeChild(f);
                        }, 333);
                        return true;
                    }
                }
            });


            // Bind pagination events

            this._on(this.element, {
                "click .paginationpage": function (event) {
                    event.stopImmediatePropagation();
                    console.log(event);
                    var pagenum = $(event.currentTarget).text();
                    this.element.find('.tablerenderpagination > ul > li').removeClass('active');
                    if (!(pagenum === "<<" || pagenum === ">>")) {
                        this._privateData.currentPage = parseInt(pagenum, 10);
                        $(event.currentTarget).addClass('active');
                    } else if (pagenum === ">>") {
                        if (!(this._privateData.currentBlock + 1 > this._privateData.totalBlocks)) {
                            this._privateData.currentBlock = this._privateData.currentBlock + 1;
                            this._privateData.currentPage = this._privateData.currentBlock * this.options.paginationPageSize - this.options.paginationPageSize + 1;
                            this._renderPagination();
                        } else {
                            return;
                        }
                    } else if (pagenum === "<<") {
                        if (!(this._privateData.currentBlock - 1 <= 0)) {
                            this._privateData.currentBlock = this._privateData.currentBlock - 1;
                            this._privateData.currentPage = this._privateData.currentBlock * this.options.paginationPageSize - this.options.paginationPageSize + 1;
                            this._renderPagination();
                        } else {
                            return;
                        }
                    }
                    this._renderRows();
                }
            });
        },
        refresh: function () {

        },
        _destroy: function () {
            this.element.html('');
        }
    });
}));