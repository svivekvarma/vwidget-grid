var globaldata = {};

$(function () {
    $.getJSON('js/data.json').done(function (data) {
        globaldata = data;

        // $('#sample1').vGrid({ data: data.fathers, showOnlyMode: false, showOnlyFields: ["id"] });

        $('#sample2').vGrid({
            data: data.fathers,
            showOnlyMode: true,
            sortField: "email",
            sortFieldType: "string",
            showOnlyFields: ["ID","name","email","dateofbirth","biography","comments","accounts", "spousename", "married"],
            amalgateColumns: [{
                prepend: false,
                columnHeader: "Special",
                template: function (record, index) {

                    return '<input type="button" value="Submit" data-id="' + record.ID + '"/>';
                }
            }]
        });
    });

  /*  setTimeout(function(){
          globaldata.fathers = globaldata.fathers.splice(1,5);
          $('#sample2').vGrid('option', 'data', globaldata.fathers);
    },4000)
*/
})