function update_scatterplot(var_selection) {
    var xVar = labelMap[var_selection];

    var chart = d3.select('#scatterplot')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    var data_filtered = DATASET.filter(d => !isNaN(d[xVar]) && d[xVar] != 0 && d['ChlValues'] != 0);
    var averaged = d3.rollup(data_filtered, 
        function(v) {
            return {yval: d3.mean(v, d => d['ChlValues']), 
                    xval: d3.mean(v, d => d[xVar])}
        }, 
        d => d['UniqueLakeName']);

    var new_data = Array.from(averaged.values());
    //console.log(new_data)
    
    if (xVar == 'pH') {  // convert data to log scale unless it is pH
        var xs = d3.scaleLinear()
            .domain([d3.min(new_data, d => d.xval), d3.max(new_data, d => d.xval)])
            .range([0, width]);
    } else {
        var xs = d3.scaleLog().base(10)
            .domain([d3.min(new_data, d => d.xval), d3.max(new_data, d => d.xval)])
            .range([0, width]);
    }
    
    var ys = d3.scaleLog().base(10)
        .domain([d3.min(new_data, d => d.yval), d3.max(new_data, d => d.yval)])
        .range([height, 0]);

    chart.append("rect")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("fill", "white");
    
    //d3.select('body').append('div').attr('id', 'tooltip').attr('style', 'position: absolute; opacity: 0;');

    chart.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .selectAll("circle")
        .data(new_data)
        .enter()
        .append("circle")
            .attr("cx", function(d) {return xs(d.xval);})  
            .attr("cy", function(d) {return ys(d.yval);})
            .attr("r", 3);
            //.on("mouseover", function(d) {
            //    d3.select('#tooltip').style("opacity", 1)
            //        .style("left", (d3.event.pageX) + "px")
            //        .style("top", (d3.event.pageY) + "px")
            //        .html("Item # is "+d);
            //})
            //.on("mouseout", function() {tooltip.style("opacity", 0);});  

    chart.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(d3.axisLeft(ys));
        //.call(d3.axisLeft(ys).tickValues([0.0001,0.001,0.01,0.1,1,10]).tickFormat(d3.format("~s")));

    chart.append("g")
        .attr("transform", "translate(" + margin.left + "," + (margin.top + height) + ")")
        .call(d3.axisBottom(xs));
        //.call(d3.axisBottom(xs).tickValues([10,20,50,100]).tickFormat(d3.format("~s")));

    chart.append("text")
        .attr("transform", "translate(" + ((width + margin.left + margin.right) / 2) + "," + (height + margin.top + 40) + ")")
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .text(var_selection);

    chart.append("text")
        .attr("transform", "translate(" + (margin.left - 40) + "," + ((height + margin.top + margin.bottom) / 2) + ") rotate(-90)")
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("Chlorophyll a Concentration (mg/L)");
}

d3.select("#xvar").on("change", function(d) {
    var selected_option = d3.select(this).property("value");
    update_scatterplot(selected_option);
})
