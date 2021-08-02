function update_map() {
    var chart = d3.select('#map')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);
        //.style("display", "block")
        //.attr('viewBox', [0, 0, (width + margin.left + margin.right), (height + margin.top + margin.bottom)]);
    
    var averaged = d3.rollup(DATASET, 
        function(v) {
            return {lat: d3.mean(v, d => d['Lat']), 
                    lon: d3.mean(v, d => d['Lon']), 
                    //position: [d3.mean(v, d => d['Lat']), d3.mean(v, d => d['Lon'])],
                    chla: d3.mean(v, d => d['ChlValues'])}
        }, 
        d => d['UniqueLakeName']);

    var new_data = Array.from(averaged.values());

    //var world = d3.json('./data/countries-50m.json');
    var countries = topojson.feature(WORLD_TOPO, WORLD_TOPO.objects.countries);
    var borders = topojson.mesh(WORLD_TOPO, WORLD_TOPO.objects.countries, (a, b) => a !== b);
    var projection = d3.geoMercator()
        .center([0, 0])
        .translate([((width + margin.left + margin.right) / 2), ((height + margin.top + margin.bottom) / 2)])
        .scale((height + margin.top + margin.bottom) / (2 * Math.PI));
    var path = d3.geoPath(projection);

    chart.append("rect")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("fill", "white");

    var radius = d3.scaleSqrt()
        .domain([0, d3.max(new_data, d => d.chla)])
        .range([0, 40]);

    chart.append("path")
        .datum(countries)
        .attr("fill", "#ccc")
        .attr("d", path);

    chart.append("path")
        .datum(borders)
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-linejoin", "round")
        .attr("d", path);

    chart.append("g")
        .selectAll("circle")
        .data(new_data.sort((a, b) => d3.descending(a.chla, b.chla)))
        .enter()
        .append("circle")
            .attr("cx", function(d) {
                var c = [d.lon, d.lat];
                var p = projection(c);
                return p[0];
            })
            .attr("cy", function(d) {
                var c = [d.lon, d.lat];
                var p = projection(c);
                return p[1];
            })
            .attr("r", d => radius(d.chla))
            .style("fill", "brown")
            .style("fill-opacity", 0.5)
            .style("stroke", "#fff")
            .style("stroke-width", 0.1);

    const annotations = [
        {
            note: {
                title: "Binder Lake, Iowa",
                align: "center"
            },
            data: {lon: -94.71083, lat: 41.00306, chla: 4.33},
            dx: (-0.15 * width),
            dy: (0.1 * height)
        }
    ];
    window.makeAnnotations = d3.annotation()
        .annotations(annotations)
        .type(d3.annotationCalloutElbow)
        .accessors({
            x: d => projection([d.lon, d.lat])[0] - (radius(d.chla) / Math.sqrt(2)),
            y: d => projection([d.lon, d.lat])[1] + (radius(d.chla) / Math.sqrt(2))
        });

    chart.append("g")
        .attr("class", "annotation-group")
        .call(makeAnnotations);

    chart.append("image")
        .data(annotations)
        .attr('x', d => projection([d.data['lon'], d.data['lat']])[0] - (radius(d.data['chla']) / Math.sqrt(2)) + d.dx - (0.03 * width))
        .attr('y', d => projection([d.data['lon'], d.data['lat']])[1] + (radius(d.data['chla']) / Math.sqrt(2)) + d.dy + (0.04 * height))
        .attr('width', (0.24 * width))
        .attr('height', (0.24 * height))
        .attr('xlink:href', 'img/binder_lake_iowa.jpeg');
}

