var globaldata = {};

$(function () {
    $.getJSON('js/data.json').done(function (data) {
        globaldata = data;
        console.log(data);
        $('#sample1').vgrid({ data: data.fathers, showOnlyMode: false, showOnlyFields: ["id"] });

        $('#sample2').vgrid({ data: data.fathers, 
            showOnlyMode: true, 
            showOnlyFields: ["accounts", "spousename", "married"] });

    });

    $('#deletelastrecord').click(function () {
        console.log(globaldata.fathers.length);
        globaldata.fathers.pop();
        console.log(globaldata.fathers.length);
        $('#sample1').vgrid('option', 'data', globaldata.fathers);
    })
})