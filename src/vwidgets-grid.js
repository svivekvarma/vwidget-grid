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
}(function ($) {

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
            sortField: "",
            sortFieldType: "",
            rowEvents: function () { },
            showPagination: true,
            paginationPageSize: 5,
            pageSize: 25,
            customPageSize: true,
            showSearchOption: true,
            showPrintOption: false,
            showCsvOption: true,
            showPDFOption: false,
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
                headers: [],
                fieldType: []
            }

            this._privateData.originalData = this.options.data;
            this._scaffold();
            this._newDataCalculations();
            this._renderDeskTop();
            this._renderMobile();

            if (this.options.sortField !== "") {
                this.element.find('th[data-realname=' + this.options.sortField + ']').trigger("click");
            }

        },
        _scaffold: function () {
            this.element.append('<div class="paginationcontainer"></div>');
            this.element.append('<div class="custompagesizecontainer"></div>');
            this.element.append('<div class="exportoptions"></div>');
            this.element.append('<div class="searchsection"></div>');
            this.element.append('<div class="displayrecordsinfo">');
            this.element.append('<div class="gridcontainer"></div>');
            this.element.append('<div class="gridlistcontainer">');
            this.element.append('<div class="displayrecordsinfo">');
        },
        _setOption: function (key, value) {
            this._super(key, value);
            if (key === "data") {
                this._privateData.originalData = value;
                this._newDataCalculations();
                //if (this._privateData.renderedPagination) {
                if (this.element.find('input.searchtextfield').val() && this.element.find('input.searchtextfield').val() !== "") {
                    this._searchText(this.element.find('input.searchtextfield').val());
                } else {
                    if (this._privateData.sortField !== null || this._privateData.sortField !== "") {
                        //this.element.find('th[data-realname=' + this._privateData.sortField + ']').trigger("click");
                        this._sort(this._privateData.sortFieldType);
                    } else {
                        this._refresh();
                    }
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
                    this._renderCustomPageSize();
                }
                this._renderSearchandExportOption();
                this._generateTable();
                this._renderDisplayRecordsInfo();
                //check if overflow needs to be setup for grid container
                if (this.element.find('.' + this.options.css.table + '').width() > this.element.find('.gridcontainer').width()) {
                    this.element.find('.gridcontainer').css('overflow-x', 'scroll');
                }
                // Add event binding here
                this._bindEvents();
            }
        },
        _newDataCalculations: function () {
            this._calculatePagesBlocks();
            this._extractHeaders();

        },
        _refresh: function () {
            this.element.find(".paginationcontainer").html();
            this.element.find(".gridcontainer").html();
            this.element.find(".gridlistcontainer").html();
            if (this._privateData.headers.length > 0) {
                if (this.options.showPagination) {
                    this._renderPagination();
                }
                this._generateTable();
                this._renderDisplayRecordsInfo();
                //check if overflow needs to be setup for grid container
                if (this.element.find('.' + this.options.css.table + '').width() > this.element.find('.gridcontainer').width()) {
                    this.element.find('.gridcontainer').css('overflow-x', 'scroll');
                }

            }
            this._renderMobile();
        },
        _renderMobile: function () {
            this._generateList(false);
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
                                var tempObj = {};
                                tempObj[key] =  typeof obj[key];
                                this._privateData.fieldType.push(tempObj);
                            }
                        }
                    }
                }
                this._privateData.headers = headers;
            } else {
                this._privateData.headers = this.options.showOnlyFields;
                 if (this.options.data.length > 0) {
                    var obj = this.options.data[0];
                    var i = 0, field;
                    for(i=0; i< this.options.showOnlyFields.length; i++){
                        
                        field = this.options.showOnlyFields[i];
                        var tempObj = {};
                        tempObj[field] = typeof obj[this.options.showOnlyFields[i]];
                        this._privateData.fieldType.push(tempObj);
                    } 
                 }
            }
        },
        _getFieldType: function(data){
            return typeof data;
        },
        _renderDisplayRecordsInfo: function () {
            var recordinfo = this._calculateStartEndRecords(false);
            recordinfo.startrecord = recordinfo.startrecord + 1;
            recordinfo.endrecord = recordinfo.endrecord + 1;
            this.element.find('.displayrecordsinfo').html('Showing records ' + recordinfo.startrecord + ' to ' + recordinfo.endrecord + ' of ' + this.options.data.length + " records");
        },
        _renderSearchandExportOption: function () {
            if (this.options.showSearchOption) {
                this.element.find('.searchsection').html('<label>Search </label><input type="search" class="searchtextfield" placeholder="Filter your results by typing search text"/>');
            }
            var arrHTML = [];
            if (this.options.showPrintOption || this.options.showExportOptions) {

                if (this.options.showPrintOption) {
                    arrHTML.push('<div class="icon printicon">');

                    arrHTML.push('</div>');
                }
                if (this.options.showCsvOption) {
                    arrHTML.push('<div class="icon downloadicon">');
                    arrHTML.push('</div>');
                }
                if (this.options.showPDFOption) {
                    arrHTML.push('<div class="icon pdficon">');
                    arrHTML.push('</div>');
                }
            }
            this.element.find('.exportoptions').html(arrHTML.join(''));
        },
        _renderCustomPageSize: function () {
            var arrHTML = [];
            arrHTML.push('<select name="custompagesize">');
            arrHTML.push('<option value="25">25</option>');
            arrHTML.push('<option value="75">75</option>');
            arrHTML.push('<option value="100">100</option>');
            arrHTML.push('</select>');
            this.element.find('.custompagesizecontainer').html(arrHTML.join(''));
        },
        _renderPagination: function () {

            if (this.options.showPagination) {
                var arrPagination = [];

                if (!this._privateData.renderedPagination) {
                    arrPagination.push('<ul>');
                    arrPagination.push('</ul>');
                    this.element.find('.paginationcontainer').html(arrPagination.join(''));
                    arrPagination = [];
                }

                if (this.options.data.length <= 0) {
                    this.element.find('.paginationcontainer').find('ul').html('');
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
                this.element.find('.paginationcontainer').find('ul').html(arrPagination.join(''));
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
        _getFieldType: function(field){
            var i =0, type;
            for(i = 0; i< this._privateData.fieldType.length; i++){
                if(this._privateData.fieldType[i][field]){
                    type = this._privateData.fieldType[i][field];
                    break;
                }
            }
            return type;
        },
        _generateTable: function (exportmode) {
            var arrHTML = [];

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

                        arrHTML.push(' <th data-realname="' + this.options.showOnlyFields[i] + '" data-fieldType="' + this._getFieldType(this.options.showOnlyFields[i]) +'">');
                        arrHTML.push('<div>');
                        arrHTML.push(this._headerOutput(this.options.showOnlyFields[i]));
                        arrHTML.push('<div class="sortersymbols">');
                        if (this._privateData.sortField === this.options.showOnlyFields[i] && this._privateData.sortOrder) {
                            arrHTML.push('<span class="sortindicator asc active">&#9650;</span>');
                        } else {
                            arrHTML.push('<span class="sortindicator asc">&#9650;</span>');
                        }
                        if (this._privateData.sortField === this.options.showOnlyFields[i] && !this._privateData.sortOrder) {
                            arrHTML.push('<span class="sortindicator desc active">&#9660;</span>');
                        } else {
                            arrHTML.push('<span class="sortindicator desc">&#9660;</span>');
                        }

                        arrHTML.push('</div>');
                        arrHTML.push('</div>');
                        arrHTML.push('</th>');
                    }
                } else {
                    if (this._privateData.headers.length > 0) {
                        for (var i = 0; i < this._privateData.headers.length; i++) {
                            arrHTML.push(' <th data-realname="' + this._privateData.headers[i] + '" data-fieldType="' + this._getFieldType(this._privateData.headers[i]) +'">');
                            arrHTML.push('<div>');
                            arrHTML.push(this._headerOutput(this._privateData.headers[i]));
                            arrHTML.push('<div class="sortersymbols">');
                            if (this._privateData.sortField === this._privateData.headers[i] && this._privateData.sortOrder) {
                                arrHTML.push('<span class="sortindicator asc active">&#9650;</span>');
                            } else {
                                arrHTML.push('<span class="sortindicator asc">&#9650;</span>');
                            }

                            if (this._privateData.sortField === this.options.headers[i] && !this._privateData.sortOrder) {
                                arrHTML.push('<span class="sortindicator desc active">&#9660;</span>');
                            } else {
                                arrHTML.push('<span class="sortindicator desc">&#9660;</span>');
                            }

                            arrHTML.push('</div>');
                            arrHTML.push('</div>');
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
            this.element.find('.gridcontainer').html(arrHTML.join(''));
            return;
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
            this.element.find('.gridlistcontainer').html(arrHTML.join(''));
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
        _sampleContentLength: function () {

        },
        _convertToCSV: function convertArrayOfObjectsToCSV(args) {
            var result, ctr, keys, columnDelimiter, lineDelimiter, data, tempFieldResult;
            data = this.options.data;

            if (data == null || !data.length) {
                return null;
            }

            columnDelimiter = columnDelimiter || ',';
            lineDelimiter = lineDelimiter || '\n';
            keys = Object.keys(data[0]);

            var m = 0;
            tempHeader = [];

            for (m = 0; m < keys.length; m++) {
                if (keys[m] == "ID") {
                    tempHeader.push("idx");
                } else {
                    tempHeader.push(keys[m]);
                }
            }

            result = '';
            result += tempHeader.join(columnDelimiter);
            result += lineDelimiter;

            data.forEach(function (item) {
                ctr = 0;
                keys.forEach(function (key) {
                    if (ctr > 0) result += columnDelimiter;

                    result += item[key];

                    tempFieldResult = '';
                    tempFieldResult = item[key];
                    tempFieldResult = tempFieldResult.replace(/,/g, '');
                    result += tempFieldResult;

                    ctr++;
                });
                result += lineDelimiter;
            });
            return result;
        },
        _convertToCSVVisualData: function () {
            var result, ctr, columnDelimiter, lineDelimiter, tempFieldResult;
            columnDelimiter = columnDelimiter || ',';
            lineDelimiter = lineDelimiter || '\n';

            if (this.options.data.length === 0) {
                return null;
            }

            var m = 0;
            tempHeader = [];

            for (m = 0; m < this._privateData.headers.length; m++) {
                if (this._privateData.headers[m] == "ID") {
                    tempHeader.push("idx");
                } else {
                    tempHeader.push(this._privateData.headers[m]);
                }
            }

            result = '';
            tempFieldResult = '';
            result += tempHeader.join(columnDelimiter);
            result += lineDelimiter;
            var i = 0;
            for (i = 0; i < this.options.data.length; i++) {

                if (this.options.showOnlyMode) {
                    for (var j = 0; j < this.options.showOnlyFields.length; j++) {
                        if (j > 0) {
                            result += columnDelimiter;
                        }
                        try {

                            tempFieldResult = '';
                            tempFieldResult = this._fieldOutput(this.options.data[i][this.options.showOnlyFields[j]], this.options.showOnlyFields[j], this.options.data[i]);
                            if ($.type(tempFieldResult) === "string") {
                                tempFieldResult = tempFieldResult.replace(/,/g, '');
                                result += tempFieldResult;
                            } else {
                                result += this._fieldOutput(this.options.data[i][this.options.showOnlyFields[j]], this.options.showOnlyFields[j], this.options.data[i]);
                            }
                        } catch (exception) {
                            console.log("error at" + i + " --- " + j);
                        }

                    }
                } else {
                    for (var j = 0; j < this._privateData.headers.length; j++) {
                        if (j > 0) {
                            result += columnDelimiter;
                        }

                        tempFieldResult = '';
                        tempFieldResult = this._fieldOutput(this.options.data[i][this._privateData.headers[j]], this._privateData.headers[j], this.options.data[i]);
                        if ($.type(tempFieldResult) === "string") {
                            tempFieldResult = tempFieldResult.replace(/,/g, '');
                            result += tempFieldResult;
                        } else {
                            result += this._fieldOutput(this.options.data[i][this._privateData.headers[j]], this._privateData.headers[j], this.options.data[i]);
                        }
                    }
                }
                result += lineDelimiter;
            }
            return result;
        },
        _convertToPdfVisualData: function () {

            var i = 0;
            var rows = [];
            for (i = 0; i < this.options.data.length; i++) {
                var row = [];
                if (this.options.showOnlyMode) {
                    for (var j = 0; j < this.options.showOnlyFields.length; j++) {
                        row.push(this._fieldOutput(this.options.data[i][this.options.showOnlyFields[j]], this.options.showOnlyFields[j], this.options.data[i]));
                    }
                } else {
                    for (var j = 0; j < this._privateData.headers.length; j++) {
                        row.push(this._fieldOutput(this.options.data[i][this._privateData.headers[j]], this._privateData.headers[j], this.options.data[i]));
                    }
                }
                rows.push(row);
            }
            var doc = new jsPDF('p', 'pt');
            //doc.autoTable(this._privateData.headers, rows);

            doc.autoTable(this._privateData.headers, rows, {
                margin: { horizontal: 10 },
                styles: { overflow: 'linebreak' },
                bodyStyles: { valign: 'top' }
            });
            doc.save("export.pdf");
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
        _sort: function (type) {
            var sortstring = this._privateData.sortOrder == true ? "" : "-";
            this.options.data = this.options.data.sort(this._customSort(sortstring + this._privateData.sortField, type));
            this._refresh();
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
            this._newDataCalculations();
            this._refresh();
        },
        _bindEvents: function () {

            // sort field binding

            this._on(this.element, {
                "click th": function (event) {
                    event.stopImmediatePropagation();

                    if (!($(event.currentTarget).attr('data-realname') === "amalgated")) {
                        var sortField = $(event.currentTarget).attr('data-realname');
                        var fieldType = $(event.currentTarget).attr('data-fieldtype');
                        if (!this._privateData.sortField === sortField) {
                            this._privateData.sortOrder = true;
                        } else {
                            this._privateData.sortOrder = !this._privateData.sortOrder;
                        }
                        this._privateData.sortField = sortField;
                        this._privateData.sortFieldType = fieldType;
                        this.element.find('.paginationcontainer > ul > li').removeClass('active');
                        this._privateData.currentBlock = 1;
                        this._privateData.currentPage = 1;
                        this._renderPagination();
                        this._sort(fieldType);
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
                    //var csv = this._convertToCSV();
                    var csv = this._convertToCSVVisualData();
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

            // pdf events 

            this._on(this.element, {
                "click .pdficon": function (event) {
                    event.stopImmediatePropagation();

                    var data, link;
                    //var csv = this._convertToCSV();
                    var pdf = this._convertToPdfVisualData();
                }
            });

            // Bind pagination events

            this._on(this.element, {
                "click .paginationpage": function (event) {
                    event.stopImmediatePropagation();
                    var pagenum = $(event.currentTarget).text();
                    this.element.find('.paginationcontainer > ul > li').removeClass('active');
                    if (!(pagenum === "<<" || pagenum === ">>")) {
                        this._privateData.currentPage = parseInt(pagenum, 10);
                        $(event.currentTarget).addClass('active');
                    } else if (pagenum === ">>") {
                        if (!(this._privateData.currentBlock + 1 > this._privateData.totalBlocks)) {
                            this._privateData.currentBlock = this._privateData.currentBlock + 1;
                            this._privateData.currentPage = this._privateData.currentBlock * this.options.paginationPageSize - this.options.paginationPageSize + 1;

                        } else {
                            return;
                        }
                    } else if (pagenum === "<<") {
                        if (!(this._privateData.currentBlock - 1 <= 0)) {
                            this._privateData.currentBlock = this._privateData.currentBlock - 1;
                            this._privateData.currentPage = this._privateData.currentBlock * this.options.paginationPageSize - this.options.paginationPageSize + 1;

                        } else {
                            return;
                        }
                    }
                    this._refresh();
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
                    this._newDataCalculations();
                    this._refresh();
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
