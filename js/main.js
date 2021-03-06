var globaldata = {};

$(function () {
    $.getJSON('js/data.json').done(function (data) {
        globaldata = data;

        // $('#sample1').vGrid({ data: data.fathers, showOnlyMode: false, showOnlyFields: ["id"] });

        $('#sample2').vGrid({
            data: data.fathers,
            showOnlyMode: true,
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


    
    setTimeout(function(){
          $('#sample2').vGrid('option', 'data', []);
    },2000)

     
    setTimeout(function(){
          $('#sample2').vGrid('option', 'data', globaldata.fathers);
    },4000)



    $('#sample2').on('click', function (event) {
        console.log(event);
        var index = parseInt($(event.target).attr("data-id"));
        //console.log(globaldata.fathers.length);
        var foundindex = 0;

        $.each(globaldata.fathers, function (i, n) {
            if (n.ID === index) {
                foundindex = i;
            }
        })
        globaldata.fathers.splice(foundindex, 1);
        //console.log(globaldata.fathers.length);
        $('#sample2').vGrid('option', 'data', globaldata.fathers);

    });

    // $('#deletelastrecord').click(function () {

    //     globaldata.fathers.pop();

    //     $('#sample1').vGrid('option', 'data', globaldata.fathers);
    // })
})