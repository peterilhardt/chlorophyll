function update_time_series(lake_selection_list) {
    var chart = d3.select('#time_series')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    var great_lakes = {
        'Lake Erie': 'L2052',
        'Lake Michigan': 'L2711',
        'Lake Superior': 'L6915',
        'Lake Ontario': 'L3277',
        'Lake Huron': 'L3185'
    };
    //var great_lakes_ids = ['L2052', 'L2711', 'L6915', 'L3277', 'L3185'];
    //var great_lakes_names = ['Lake Erie', 'Lake Michigan', 'Lake Superior', 'Lake Ontario', 'Lake Huron'];
    
    var selected_ids = lake_selection_list.map(x => great_lakes[x]);

    var data_filtered = DATASET.filter(function(d) {
        return !isNaN(d['Year']) && d['Year'] != "" && d['ChlValues'] != 0 && selected_ids.indexOf(d.UniqueLakeName) >= 0
    });

    var averaged = d3.rollup(data_filtered, 
        function(v) {
            return {chla: d3.mean(v, d => d['ChlValues'])}
        },
        d => d['UniqueLakeName'], d => d['Year']);
    var lake_ids = Array.from(averaged.keys());
    var values_only = Array.from(averaged.values());
    
    var xs = d3.scaleLinear()
        .domain([d3.min(values_only, arr => d3.min(Array.from(arr), d => d[0])), 
                d3.max(values_only, arr => d3.max(Array.from(arr), d => d[0]))])
        .range([0, width]);

    var ys = d3.scaleLog().base(10)
        .domain([d3.min(values_only, arr => d3.min(Array.from(arr), d => d[1].chla)), 
                d3.max(values_only, arr => d3.max(Array.from(arr), d => d[1].chla))])
        .range([height, 0]);

    var cs = d3.scaleOrdinal()
        .domain([...Array(values_only.length)])
        .range(["red", "blue", "green", "gold", "grey"]);

    chart.append("rect")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("fill", "white");
    
    for (var i = 0; i < values_only.length; i++) {
        var lake_data = Array.from(values_only[i].entries());

        chart.append('g')
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .append('path')
                .datum(lake_data.sort((a, b) => d3.ascending(a[0], b[0])))
                .attr('fill', 'none')
                .attr('stroke', cs(i))
                .attr('stroke-width', 1.5)
                .attr('stroke-linejoin', 'round')
                .attr('stroke-linecap', 'round')
                .attr('d', d3.line()
                    .x(d => xs(d[0]))
                    .y(d => ys(d[1].chla)));
    }

    chart.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(d3.axisLeft(ys));
    
    chart.append("g")
        .attr("transform", "translate(" + margin.left + "," + (margin.top + height) + ")")
        .call(d3.axisBottom(xs).tickFormat(d3.format("d")));

    chart.append("text")
        .attr("transform", "translate(" + (margin.left - 40) + "," + ((height + margin.top + margin.bottom) / 2) + ") rotate(-90)")
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("Chlorophyll a Concentration (mg/L)");

    var legend_size = 20;
    chart.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .selectAll("mydots")
        .data(lake_selection_list)
        .enter()
        .append("rect")
            .attr("x", 10)
            .attr("y", function(d,i) {return 5 + i * (legend_size + 5)})
            .attr("width", legend_size)
            .attr("height", legend_size)
            .style("fill", d => cs(lake_ids.indexOf(great_lakes[d])));

    chart.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .selectAll("mylabels")
        .data(lake_selection_list)
        .enter()
        .append("text")
            .attr("x", 10 + legend_size * 1.2)
            .attr("y", function(d,i) {return 5 + i * (legend_size + 5) + (legend_size / 2)})
            .style("fill", d => cs(lake_ids.indexOf(great_lakes[d])))
            .text(d => d)
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle");

    const annotations = [
        {
            note: {
                //label: "An algal bloom became so toxic that 500,000 people in Toledo, Ohio were left without drinking water for days",
                title: "Lake Erie, 2014",
                align: "center"
            },
            data: {x: 2014, y: 0.264},
            dx: -(0.5 * width),
            dy: 20
        }
    ];
    window.makeAnnotations = d3.annotation()
        .annotations(annotations)
        .type(d3.annotationCalloutElbow)
        .accessors({
            x: d => xs(d.x),
            y: d=> ys(d.y)
        })
        .accessorsInverse({
            x: d => xs.invert(d.x),
            y: d => ys.invert(d.y)
        });

    chart.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("class", "annotation-group")
        .call(makeAnnotations);
    
    chart.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .append("text")
            .data(annotations)
            .attr("x", d => xs(d.data['x']) + d['dx'])
            .attr("y", d => ys(d.data['y']) + d['dy'] + 35)
            .style('font-size', '15px')
            .text("An algal bloom became so toxic that");

    chart.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .append('text')
            .data(annotations)
            .attr("x", d => xs(d.data['x']) + d['dx'])
            .attr("y", d => ys(d.data['y']) + d['dy'] + 50)
            .style('font-size', '15px')
            .text("500,000 people in Toledo, Ohio were");
    
    chart.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .append('text')
            .data(annotations)
            .attr("x", d => xs(d.data['x']) + d['dx'])
            .attr("y", d => ys(d.data['y']) + d['dy'] + 65)
            .style('font-size', '15px')
            .text("left without drinking water for days");
}

d3.select("#lake_select").on("change", function(d) {
    var selected_options = $('#lake_select').val();
    update_time_series(selected_options);
})