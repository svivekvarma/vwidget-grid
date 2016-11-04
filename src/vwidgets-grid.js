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

    $.widget("vwidgets.vGrid", {
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
            customPageSize: true,
            showSearchOption: true,
            showPrintOption: true,
            showCsvOption: true,
            showExportOptions: true
        },
        _create: function () {
            this.element.addClass("vwidgetsgrid");
            this._privateData = {
                renderedPagination: false,
                currentPage: 1,
                currentBlock: 1,
                totalPages: 0,
                totalBlocks: 0,
                dataconfiguration: {},
                headers: []
            }
            this._privateData.originalData = this.options.data;
            this._calculatePagesBlocks();
            this._extractHeaders();
            this._renderDeskTop();
            this._renderMobile();
        },
        _setOption: function (key, value) {
            this._super(key, value);
            if (key === "data") {
                this.element.html('');
                this._privateData.originalData = value;
                this._calculatePagesBlocks();
                this._extractHeaders();
                this._renderDeskTop();
                this._renderMobile();
                
                //if (this._privateData.renderedPagination) {
                if (this.element.find('input.searchtextfield').val() && this.element.find('input.searchtextfield').val() !== "") {
                    this._searchText(this.element.find('input.searchtextfield').val());
                }
               
            }
        },
        _setOptions: function (options) {
            this._super(options);
            this.refresh();
        },
        _renderDeskTop: function () {

            if (this._privateData.headers.length > 0) {
                if (this.options.showPagination) {
                    this._renderPagination();
                    this.element.append(this._renderCustomPageSize());
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

                // Add event binding here
                this._bindEvents();

            }
        },
        _renderMobile: function () {
            var arrHTML = [];
            arrHTML.push('<div class="gridlistcontainer">');
            arrHTML.push('</div>');
            this.element.append(arrHTML.join(''));
            this.element.find('.gridlistcontainer').html(this._generateList(false).join(''));
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
        _renderCustomPageSize: function () {
            var arrHTML = [];
            arrHTML.push('<select name="custompagesize">');
            arrHTML.push('<option value="-1">Pick one</option>');
            if (this.options.data.length > 5) {
                arrHTML.push('<option value="5">5</option>');
            }
            if (this.options.data.length > 10) {
                arrHTML.push('<option value="10">10</option>');
            }

            if (this.options.data.length > 25) {
                arrHTML.push('<option value="25">25</option>');
            }

            arrHTML.push('<option value="0">All</option>');
            arrHTML.push('</select>');
            return arrHTML.join('');
        },
        _renderPagination: function () {

            if (this.options.showPagination) {
                var arrPagination = [];
                
                if (!this._privateData.renderedPagination) {
                    arrPagination.push('<div class=tablerenderpagination>');
                    arrPagination.push('<ul>');
                    arrPagination.push('</ul>');
                    arrPagination.push('</div>');
                    this.element.append(arrPagination.join(''));
                    arrPagination = [];
                }
                
                if (this.options.data.length <= 0) {
                    this.element.find('.tablerenderpagination').find('ul').html('');
                    return;
                }

                // render the page number based on block logic
                var startpage;
                var endpage;

                var result = this._calculateStartEndPage();
                startpage = result.startpage;
                endpage = result.endpage;

                arrPagination.push('<li class="paginationpage"><a>' + "<<" + '</a></li>');
                for (var i = startpage; i <= endpage; i++) {
                    if (i == this._privateData.currentPage) {
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
        _calculatePagesBlocks: function () {
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
        },
        _calculateStartEndPage: function () {

            var startpage;
            var endpage;
            if (this._privateData.currentPage > this._privateData.totalPages) {
                this._privateData.currentPage = this._privateData.totalPages;
            }
            var blocktorender = 1;
            for (var i = 1; i <= this._privateData.totalBlocks; i++) {
                if (this._privateData.currentPage <= (i * this.options.paginationPageSize) &&
                    this._privateData.currentPage >= (i * this.options.paginationPageSize - this.options.paginationPageSize + 1)) {
                    this._privateData.currentBlock = i;
                    endpage = i * this.options.paginationPageSize;
                    startpage = i * this.options.paginationPageSize - this.options.paginationPageSize + 1;
                    break;
                }
            }

            if (endpage > this._privateData.totalPages) {
                endpage = this._privateData.totalPages;
            }
            return { startpage: startpage, endpage: endpage };
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
                if (this.options.showOnlyMode) {
                    for (var i = 0; i < this.options.showOnlyFields.length; i++) {
                        arrHTML.push(' <th data-realname="' + this.options.showOnlyFields[i] + '">');
                        arrHTML.push(this._headerOutput(this.options.showOnlyFields[i]));
                        arrHTML.push('<span class="sortindicator asc">&uarr;</span>');
                        arrHTML.push('<span class="sortindicator desc">&darr;</span>');
                        arrHTML.push('</th>');
                    }
                } else {
                    if (this._privateData.headers.length > 0) {
                        for (var i = 0; i < this._privateData.headers.length; i++) {
                            arrHTML.push(' <th data-realname="' + this._privateData.headers[i] + '">');
                            arrHTML.push(this._headerOutput(this._privateData.headers[i]));
                            arrHTML.push('<span class="sortindicator asc">&uarr;</span>');
                            arrHTML.push('<span class="sortindicator desc">&darr;</span>');
                            arrHTML.push('</th>');
                        }
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


            } 

            arrHTML.push(' </thead>');
            arrHTML.push(' <tbody>');
            arrHTML = arrHTML.concat(this._getRowsHtml(exportmode));
            arrHTML.push(' </tbody>');
            arrHTML.push('</table>');
            arrHTML.push('</div>');
            return arrHTML;
        },
        _generateList: function (exportmode) {
            var arrHTML = [];
            arrHTML.push(' <div class="clearboth">');
            if ((this._privateData.headers.length > 0 || this.options.amalgateColumns.length > 0) && this.options.data.length > 0) {

                var startendrecords = this._calculateStartEndRecords(exportmode);

                for (var i = startendrecords.startrecord; i <= startendrecords.endrecord; i++) {

                    arrHTML.push(' <div class="gridlistitem">');
                    if (this.options.amalgateColumns.length > 0) {
                        for (var am = 0; am < this.options.amalgateColumns.length; am++) {
                            if (this.options.amalgateColumns[am].prepend) {
                                if (this.options.amalgateColumns[am].hasOwnProperty('style')) {
                                    arrHTML.push('<div class="amalgatecolumn" style="' + this.options.amalgateColumns[am].style + '">');
                                } else {
                                    arrHTML.push('<div class="amalgatecolumn">');
                                }
                                arrHTML.push(this.options.amalgateColumns[am].template(this.options.data[i], i));
                                arrHTML.push('</div>');
                            }
                        }
                    }
                    if (this.options.showOnlyMode) {
                        for (var j = 0; j < this.options.showOnlyFields.length; j++) {
                            arrHTML.push(' <div class="listitemheader">');
                            arrHTML.push(this._headerOutput(this.options.showOnlyFields[j]));
                            arrHTML.push(' </div>');
                            arrHTML.push(' <div class="listitemfield">');
                            arrHTML.push(this._fieldOutput(this.options.data[i][this.options.showOnlyFields[j]], this.options.showOnlyFields[j], this.options.data[i]));
                            arrHTML.push(' </div>');
                        }
                    } else {
                        for (var j = 0; j < this._privateData.headers.length; j++) {
                            arrHTML.push(' <div class="listitemheader">');
                            arrHTML.push(this._headerOutput(this._privateData.headers[j]));
                            arrHTML.push(' </div>');
                            arrHTML.push(' <div class="listitemfield">');
                            arrHTML.push(this._fieldOutput(this.options.data[i][this._privateData.headers[j]], this._privateData.headers[j], this.options.data[i]));
                            arrHTML.push(' </div>');
                        }
                    }

                    if (this.options.amalgateColumns.length > 0) {
                        for (var am = 0; am < this.options.amalgateColumns.length; am++) {
                            if (!this.options.amalgateColumns[am].prepend) {
                                if (this.options.amalgateColumns[am].hasOwnProperty('style')) {
                                    arrHTML.push('<div class="amalgatecolumn" style="' + this.options.amalgateColumns[am].style + '">');
                                } else {
                                    arrHTML.push('<div class="amalgatecolumn">');
                                }
                                arrHTML.push(this.options.amalgateColumns[am].template(this.options.data[i], i));
                                arrHTML.push('</div>');
                            }
                        }
                    }
                    arrHTML.push(' </div>');
                }
            } else {
                arrHTML.push('<div class="gridlistempty">');
                arrHTML.push(this.options.emptyDataMessage);
                arrHTML.push('</div>');
            }
            arrHTML.push(' </div>');
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
        _renderMobileDesktop: function () {
            this._renderRows();
            this.element.find('.gridlistcontainer').html(this._generateList(false).join(''));
        },
        _getRowsHtml: function (printmode) {

            arrHTML = [];

            var startendrecords = this._calculateStartEndRecords(printmode);

            if (this.options.data.length === 0) {
                var headers = this._privateData.headers;
                arrHTML.push(' <tr>');
                arrHTML.push(' <td colspan="' + headers.length + this.options.amalgateColumns.length + '" class="norecords">No records found for the search criteria</td>');
                arrHTML.push(' </tr>');
            }

            for (var i = startendrecords.startrecord; i <= startendrecords.endrecord; i++) {

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
                if (this.options.showOnlyMode) {
                    for (var j = 0; j < this.options.showOnlyFields.length; j++) {
                        arrHTML.push(' <td>');
                        arrHTML.push(this._fieldOutput(this.options.data[i][this.options.showOnlyFields[j]], this.options.showOnlyFields[j], this.options.data[i]));
                        arrHTML.push(' </td>');
                    }
                } else {
                    for (var j = 0; j < this._privateData.headers.length; j++) {
                        arrHTML.push(' <td>');
                        arrHTML.push(this._fieldOutput(this.options.data[i][this._privateData.headers[j]], this._privateData.headers[j], this.options.data[i]));
                        arrHTML.push(' </td>');
                    }
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
        _calculateStartEndRecords: function (printmode) {
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
            return { startrecord: startrecord, endrecord: endrecord };
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
            this._renderMobileDesktop();

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
            this._renderMobileDesktop();
        },
        _bindEvents: function () {

            // sort field binding

            this._on(this.element, {
                "click th": function (event) {
                    event.stopImmediatePropagation();

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
                    event.stopImmediatePropagation();

                    this._privateData.currentBlock = 1;
                    this._privateData.currentPage = 1;
                    this._searchText($(event.currentTarget).val());
                }
            });

            // Bind print events 


            this._on(this.element, {
                "click .printicon": function (event) {
                    event.stopImmediatePropagation();

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
                    event.stopImmediatePropagation();

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
                    this._renderMobileDesktop();
                }
            });

            // custom page size event binding

            this._on(this.element, {
                "change select": function (event) {
                    event.stopImmediatePropagation();
                    var pagesize = parseInt($(event.currentTarget).val());
                    if (pagesize > 0) {
                        if (pagesize > this.options.data.length) {
                            this.options.pageSize = this.options.data.length;
                        } else {
                            this.options.pageSize = pagesize;
                        }
                    }

                    if (pagesize === 0) {
                        this.options.pageSize = this.options.data.length;
                    }
                    this._privateData.currentBlock = 1;
                    this._privateData.currentPage = 1;
                    this._calculatePagesBlocks();
                    this._renderPagination();
                    this._renderMobileDesktop();
                }
            });


            $(window).on('resize', $.proxy(function () {
                //check if overflow needs to be setup for grid container
                if (this.element.find('.' + this.options.css.table + '').width() > this.element.find('.gridcontainer').width()) {
                    this.element.find('.gridcontainer').css('overflow-x', 'scroll');
                } else {
                    this.element.find('.gridcontainer').removeAttr('style');
                }
            }, this));
        },
        refresh: function () {

        },
        _destroy: function () {
            this.element.html('');
        }
    });
}));