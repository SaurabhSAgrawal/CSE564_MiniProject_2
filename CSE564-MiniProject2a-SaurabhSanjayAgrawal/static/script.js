var margin = 200, svgWidth = 600, svgHeight = 500, width = svgWidth - margin, height = svgHeight - margin;

/*Specifying range for scaling to X and Y axes*/
var xScale = d3.scaleLinear().range([0, width]);
var yScale = d3.scaleLinear().range([height, 0]);

var g;

/*Function to plot Scree Plot*/
function drawScreePlot(eigenValuePercentage) {
    d3.selectAll("svg").remove();
    d3.selectAll("table").remove();

    /*Canvas*/
    var svg = d3.select("body").select(".main")
                    .append("svg")
                        .attr("width", svgWidth)
                        .attr("height", svgHeight);
    
    /*Adding group element for graph*/
    g = svg.append("g")
                .attr("class", "group")
                .attr("transform", "translate(" + 100 + "," + 100 + ")");

    /*Heading of chart*/
    svg.append("text")
        .attr("transform", "translate(100,0)")
        .attr("x", (width / 2))
        .attr("y", 50)
        .attr("font-size", "24px")
        .style("text-anchor", "middle")
        .text("Scree plot");

    /*Specifying domain for scaling to X and Y axes*/
    xScale.domain([0, eigenValuePercentage.length + 1]);
    yScale.domain([0, 100]);


    var cumulative = [];
    /*Function to calculate cumulative 'variance explained (%)'*/
    function calculateCumulativeArr(value){
        var sum = 0;
        for(var i = 0 ; i < value.length ; i++){
            sum += value[i];
            cumulative[i] = sum;
        }
    }

    calculateCumulativeArr(eigenValuePercentage);

    /* define the line */
    var valueline2 = d3.line()
        .x(function(d, i){ return xScale(i + 1);})
        .y(function(d, i){ return yScale(cumulative[i]);});


    /*Top X axis*/
    g.append("g")
        .call(d3.axisBottom(xScale))
        .selectAll("text").remove();

    /* Add the x Axis */
    g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale))
        .selectAll("text") 
        .style("text-anchor", "end")
        .attr("dx", ".2em")
        
    /* Text label for the x axis */
    g.append("text")
        .attr("y", height + (margin / 3))
        .attr("x", (width / 2))
        .attr("text-anchor", "middle")
        .text("Principal Component")
        .style('font-weight', 'bold');
    
    /*Right Y axis*/
    g.append("g")
        .attr("transform", "translate(" + width + ", 0)")
        .call(d3.axisLeft(yScale).ticks(10)).selectAll("text").remove();;
    
    /* Add the y Axis */
    g.append("g")
        .call(d3.axisLeft(yScale).ticks(10));
    /* Text label for the y axis */
    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", 0 - (margin / 2))
        .attr("y", ((width + margin) / 20))
        .attr("dy", "-5.1em")
        .attr("text-anchor", "end")
        .text("Variance Explained (%)")
        .style('font-weight', 'bold');
    
    /*Adding bars*/
    g.selectAll(".bar")
        .data(eigenValuePercentage)
        .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d, i) { return xScale(i + 1 - 0.5) + 2; })
            .attr("y", function(d) { return yScale(d); })
            .attr("width", '48px')
            .transition()
            .ease(d3.easeLinear)
            .duration(400)
            .delay(function (d, i) {
                return i * 50;
            })
            .attr("height", function(d) { return height - yScale(d); });
    
    function click(d){
        /* Get Top Loading Attributes */
        topLoadingAttributes(d);
    }

    /* Define the div for the tooltip */
	var div = d3.select("body").append("div")	
        .attr("class", "tooltip")				
        .style("opacity", 0);

    /* Add the Cumulative Variance Explained path. */
    g.append("path")
        .datum(eigenValuePercentage)
        .attr("class", "line2")
        .attr("d", valueline2);

    g.selectAll(".dot2")
        .data(eigenValuePercentage)
        .enter().append("circle") 
                    .attr("class", "dot2")
                    .attr("cx", function(d, i) { return xScale(i + 1) })
                    .attr("cy", function(d, i) { return yScale(cumulative[i]) })
                    .attr("r", 5)
                    .on("click", function(d, i){ 
                        d3.selectAll(".dot2").style("fill", "#ddfa38");
                        d3.select(this).style("fill", "red");
                        click(i + 1); })
                    /*Mouse over and out events to display tooltip*/
                    .on("mouseover", function(d, i) {	
                        d3.select(this).style("cursor", "pointer");	
                        div.transition()		
                            .style("opacity", .9);		
                        div.html("X:" + (i + 1) + "<br/>"  + "Y:" + cumulative[i].toFixed(2) + "%")	
                            .style("left", (d3.event.pageX) + "px")		
                            .style("top", (d3.event.pageY - 28) + "px");
                        })					
                        .on("mouseout", function(d) {	
                            d3.select(this).style("cursor", "default")	
                            div.transition()		
                                .style("opacity", 0);	
                        });
    /*Crosshair vertical line*/
    var verticalLine = g.append("line")
        .attr("opacity", 0)
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("pointer-events", "none");
    /*Crosshair horizontal line*/    
    var horizontalLine = g.append("line")
        .attr("opacity", 0)
        .attr("x1", 0)
        .attr("x2", width)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("pointer-events", "none");
            
        
    g.on("mousemove", function() {  
                    mouse = d3.mouse(this);
                    mousex = mouse[0];
                    mousey = mouse[1];
                    verticalLine.attr("x1", mousex).attr("x2", mousex).attr("opacity", 1);
                    horizontalLine.attr("y1", mousey).attr("y2", mousey).attr("opacity", 1)
                })
        .on("mouseout", function() {  
                    verticalLine.attr("opacity", 0);
                    horizontalLine.attr("opacity", 0);
                });
}

/*Function to plot table with Top 4 loadings attributes */
function drawTable(data, n) {
    d3.selectAll("table").remove();
    var table = d3.select("body").select(".attrTable")
                    .append("table");
    var thead = table.append("thead");
    var tbody = table.append("tbody");
                    
    thead.append("tr").append("th").text("Top 4 Attributes (Intrinsic Dimensionality Index: " + n + ")");
    var rows = tbody.selectAll("tr")
        .data(data)
        .enter()
        .append("tr")
        .append("td")
            .html(function(d) { return d; });
}

/*Function to get data from server to plot scree plot*/
function ScreePlot() {
    $.post("", {
        'request': 'screePlot'
    }, function(result) {
        data = JSON.parse(result.screePlotData);
        drawScreePlot(data);
    })
}

/*Function to get data from server to plot Table with top 4 attributes and call function to get data from server for Scatterplot Matrix*/
function topLoadingAttributes(countPCAComponent) {
    $.post("", {
        'request': 'topLoading',
        'countPCAComponent': countPCAComponent
    }, function(result) {
        data = JSON.parse(result.topLoadingData);
        //console.log(data);
        getScatterPlotMatrixData();
        drawTable(data, countPCAComponent);
    })
}

/*Function to get data from server to plot Scatterplot Matrix*/
function getScatterPlotMatrixData() {
    $.post("", {
        'request': 'scatterPlotMatrix'
    }, function(result) {
        data = JSON.parse(result.scatterPlotMatrixData);
        //console.log(data);
        drawScatterPlotMatrix(data);
    })
}

/*Function to get data from server to plot PCA Biplot*/
function getPCABiplotData() {
    $.post("", {
        'request': 'pcaBiplot'
    }, function(result) {
        pcaBiplotDatapoints = JSON.parse(result.pcaBiplotDatapoints);
        pcaBiplotVariablesLoadings = JSON.parse(result.pcaBiplotVariablesLoadings);
        //console.log(pcaBiplotDatapoints);
        //console.log(pcaBiplotVariablesLoadings);
        drawPCABiplot(pcaBiplotDatapoints, pcaBiplotVariablesLoadings);
    })
}

function drawScatterPlotMatrix(data) {
    d3.selectAll(".svg_2").remove();
    d3.selectAll(".legend").remove();
    
    var size = 170, padding = 30;
    
    var attributesDomain = {};

    /*Filter attribute names*/
    var attributes = d3.keys(data[0]).filter(function(d) {
            return d !== "ClusterID";
        });
    /*Number of Columns i.e. attributes (4)*/
    var numAttributes = attributes.length;

    /*Min and max value i.e. domain for each attribute*/
    attributes.forEach(function(column) {
        attributesDomain[column] = d3.extent(data, function(d) {
            return d[column];
        });
    });

    var svg = d3.select("body").select(".spm")
            .attr("text-align", "center")
            .append("svg")
            .attr("class", "svg_2")
            .attr("width", size * numAttributes + padding + 45)
            .attr("height", size * numAttributes + padding + 60);

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    var xScale = d3.scaleLinear()
        .range([padding / 2, size - padding / 2]);

    var yScale = d3.scaleLinear()
        .range([size - padding / 2, padding / 2]);

    /*Heading of chart*/
    svg.append("text")
        .attr("transform", "translate(100,0)")
        .attr("x", (size * numAttributes / 2) - 80)
        .attr("y", 50)
        .attr("font-size", "24px")
        .style("text-anchor", "middle")
        .text("Scatterplot Matrix");

    var g = svg.append("g")
        .attr("transform", "translate(" + 20 + "," + 70 + ")");

    /*Placing X-axis for each attribute*/
    g.selectAll(".x.axis")
        .data(attributes)
        .enter().append("g")
        .attr("class", "x axis")
        .attr("transform", function(d, i) {
            return "translate(" + (numAttributes - i - 1) * size + ", 0)";
        })
        .each(function(d) {
            xScale.domain(attributesDomain[d]);
            d3.select(this).call(d3.axisBottom(xScale).tickSize(size * numAttributes).ticks(8));
        });
    
    /*Placing Y-axis for each attribute*/
    g.selectAll(".y.axis")
        .data(attributes)
        .enter().append("g")
        .attr("class", "y axis")
        .attr("transform", function(d, i) {
            return "translate(0, " + i * size + ")";
        })
        .each(function(d) {
            yScale.domain(attributesDomain[d]);
            d3.select(this).call(d3.axisLeft(yScale).tickSize(-size * numAttributes).ticks(8));
        });
            
    /*Scatterplot Matrix cell*/
    var spmCell = g.selectAll(".cell")
        .data(attributeCombinations(attributes, attributes))
        .enter().append("g")
        .attr("class", "cell")
        .attr("transform", function(d) {
            return "translate(" + (numAttributes - d.i - 1) * size + "," + d.j * size + ")";
        })
        .each(plotCircle);

    /*Attribute labels in diagonal*/
    spmCell.filter(function(d) {
            return d.i === d.j;
        }).append("text")
        .attr("x", padding)
        .attr("y", padding)
        .attr("dy", ".71em")
        .text(function(d) {
            return d.x;
        });

    /*Function to plot data points as circles in each cell*/
    function plotCircle(p) {
        var spmCell = d3.select(this);

        xScale.domain(attributesDomain[p.x]);
        yScale.domain(attributesDomain[p.y]);

        spmCell.selectAll("circle")
            .data(data)
            .enter().append("circle")
            .attr("cx", function(d) {
                return xScale(d[p.x]);
            })
            .attr("cy", function(d) {
                return yScale(d[p.y]);
            })
            .attr("r", 3.5)
            .attr('stroke', 'black')
            .attr('stroke-width', 0.8)
            .style("fill", function(d) {
                return color(d.ClusterID + 1);
            });
    }

    /*Legend for clusters*/
    var legend = g.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {
            return "translate(0," + i * 20 + ")";
        });

    legend.append("rect")
        .attr("x", size * numAttributes + padding + 8)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", size * numAttributes + padding + 6)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) {
            return d;
        });
}

/*Function to find all combinations of attributes*/
function attributeCombinations(attrX, attrY) {
    var combinations = [], n = attrX.length, m = attrY.length, i, j;
    for (i = 0; i < n; i++) {
        for (j = 0; j < m; j++) {
            combinations.push({x: attrX[i], i: i, y: attrY[j], j: j});
        }
    }
    return combinations;
}

/*Function to plot PCA Biplot*/
function drawPCABiplot(data, pcaBiplotVariablesLoadings) {
    d3.selectAll("svg").remove();
    d3.selectAll("table").remove();

    var svg = d3.select("body").select(".pcaBP")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);
    
    var g = svg.append("g")
        .attr("class", "group")
        .attr("transform", "translate(" + 100 + "," + 100 + ")");

    /*Heading of chart*/
    svg.append("text")
        .attr("transform", "translate(100,0)")
        .attr("x", (width / 2))
        .attr("y", 50)
        .attr("font-size", "24px")
        .style("text-anchor", "middle")
        .text("PCA Biplot");

    //X Scale
    var xScale_bpvar = d3.scaleLinear()
        .domain([-0.3, 1])
        .range([0, width]);
    //Y scale
    var yScale_bpvar = d3.scaleLinear()
        .domain([-1, 1])
        .range([height, 0]);

    g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale_bpvar));
    g.append("g")
        .call(d3.axisLeft(yScale_bpvar));

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    //circles for data points
    var circles = g.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', function(d) {
            return xScale_bpvar(d.PC1)
        })
        .attr('cy', function(d) {
            return yScale_bpvar(d.PC2)
        })
        .attr('r', '2.5')
        .attr('stroke', 'black')
        .attr('stroke-width', 0.8)
        .style("fill", function(d) {
            return color(d.ClusterID + 1);
        });
    //circles for variables
    var circlesVariables = g.selectAll('circle2')
        .data(pcaBiplotVariablesLoadings)
        .enter()
        .append('circle')
            .attr('cx', function(d) {
                return xScale_bpvar(d.PC1)
            })
            .attr('cy', function(d) {
                return yScale_bpvar(d.PC2)
            })
            .attr('r', '3')
            .style("fill", "red")
            .style("opacity", "1");
    
    //variable labels
    g.selectAll('attr').data(pcaBiplotVariablesLoadings).enter()
        .append('text')
        .attr("y", function(d) {return yScale_bpvar(d.PC2);})
        .attr("x", function(d) {return xScale_bpvar(d.PC1);})
        .style("font-size", "12px")
        .text(function(d) {return d.attr;});
    //line plot between labels
    g.selectAll('interLine').data(pcaBiplotVariablesLoadings).enter()
        .append('line')
        .style("stroke", "lightgreen")
        .attr("x1", xScale_bpvar(0))
        .attr("y1", yScale_bpvar(0))
        .attr("x2", function(d) {return xScale_bpvar(d.PC1)})
        .attr("y2", function(d) {return yScale_bpvar(d.PC2)});
    
    //Legend
    var legend = g.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {
            return "translate(0," + i * 20 + ")";
        });

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) {
            return d;
        });

    //X-axis label
    g.append("text")
        .attr("y", height + (margin / 4))
        .attr("x", (width / 2))
        .attr("text-anchor", "middle")
        .style('stroke', '#0b1a38')
        .style('stroke-opacity', '0.3')
        .attr("font-size", "12px")
        .text("PC1");
    //Y-axis label
    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style('stroke', '#0b1a38')
        .style('stroke-opacity', '0.3')
        .attr("font-size", "12px")
        .text("PC2");

}
