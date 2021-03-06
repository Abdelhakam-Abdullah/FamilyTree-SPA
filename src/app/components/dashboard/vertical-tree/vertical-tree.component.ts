import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import * as d3 from 'd3';
import { xml } from 'd3';
//import {FunctionalityService} from './../services/functionality.service';
@Component({
  selector: 'app-vertical-tree',
  templateUrl: './vertical-tree.component.html',
  styleUrls: ['./vertical-tree.component.css']
})
export class VerticalTreeComponent implements OnInit, OnChanges {
  @Input('data') data;
  @Input('width') width;
  @Input('height') height;
  @Input('nodeClick') nodeClick;
  @Input('search') search;
  @Output() userDetailsChanged: EventEmitter<any> = new EventEmitter();
  //@Input('animate') animate;
  d3: d3.TreeLayout<any>;
  duration:number = 0;
  i: number = 0;
  searchText = this.search;
  L = 20;
  depth = 0;
  //multiplier = 0;
  constructor() {
    
  }
  iter(nodeData) {    
    if(nodeData['name'].length > this.L/10 + 4){
      //console.log(this.L)
      this.L +=5;
    }
    for (var i = 0; i < nodeData.children.length; i++) {
       this.iter(nodeData.children[i]);
    }
  }

  ngOnInit() {
    this.L = 50;
    this.iter(this.data);
    
	let getDepth = (obj) => {
		if(!obj || obj.length===0 || typeof(obj)!=="object") return 0;
		const keys = Object.keys(obj);
		let depth = 0;
		keys.forEach(key=>{
			let tmpDepth = getDepth(obj[key]);
			if(tmpDepth>depth){
			    depth = tmpDepth;
			}
		})
		return depth+1;
	};
    let draw = (source) => {

      let margin = {top: 20, right: 20, bottom: 30, left: 20};
      let width = this.width - margin.left - margin.right;
      let height = this.height - margin.top - margin.bottom;

      let treemap = d3.tree()
      .separation((a, b) => {
      	return (a.children || b.children)? 2:1;
//      	return ((a.parent == b.parent) ? 1 : 2) / this.depth;
      })
      .size([width, height]);
      let treeData = treemap(root);
      let nodes = treeData.descendants();
      let links = treeData.descendants().slice(1);
  
      nodes.forEach(d => d.y = d.depth * 100);
      
      let node = g.selectAll('g.node')
        .data(nodes, d => d['id'] || (d['id'] = ++this.i));
  
      let nodeEnter = node
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr("style", "cursor: pointer")
        .attr("transform", d => "translate(" + source.x0 + "," + (source.y0) + ")")
        .on('click',(d) => {
          //$event.preventDefault();
      
          // draw(

          //   this.nodeClick(d)
            
          // )
          this.userDetailsChanged.emit(d);
        });
      
      let L = this.L;

      nodeEnter.append('rect')
        .attr('class', 'node')
        .attr('width', L)
        .attr('height', L)
        .attr('rx', d => d.children? 5 : L*0.5)
        .attr('ry', d => d.children? 5 : L*0.5)
        .attr('fill', d =>  d['data']['color'])
        .attr("x", d => -1*L*0.5)
        .attr("y", d => (d.children)? -1*L*0.5-L/2.25 : -1*L*0.5)//+(this.height/this.depth))
        //.attr("opacity", "0.75")
        
      
      nodeEnter.append('text')
        .attr("dy", ".35em")
        .attr("style", "font: 10px sans-serif")
        .attr("x", 0)
        .attr("y", d=> (d.children)? -1*L*0.5:0)//(this.height/this.depth))
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text(d =>  d.data['name'] );
        
    
      let nodeUpdate = nodeEnter.merge(<any>node);
      
      nodeUpdate.transition()
        .duration(this.duration)
        .attr("transform", d => "translate(" + d.x + "," + d.y + ")");

      nodeUpdate.select('rect')
        .attr('width', L)
        .attr('height', L)
        .attr("fill", d =>  d.data["found"] == true ? "black" : d.data["status"] == 2 ? "#dca45a" : (d.data["gender"] == 1 ? "#5eb5bc":"#80b86f"))
        //.attr("opacity", "0.75")
        
      let nodeExit = node.exit().transition()
        .duration(this.duration)
        .attr("transform",d => "translate(" + source.x + "," + source.y + ")")
        .remove();
      
      // On exit reduce the node circles size to 0
      nodeExit.select('circle')
        .attr('r', 1e-6)
        
      // On exit reduce the opacity of text labels
      nodeExit.select('text')
        .style('fill-opacity', 1e-6);
        
      // Let's draw links
      let link = g.selectAll('path.link')
        .data(links, d=> d['id']);
      
      // Work on enter links, draw straight lines
      
      let linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", "1.4")
        .attr("stroke-opacity", "0.4")
        .attr('d', (d) =>{
          let o = {x: source.x0, y: source.y0};
          return diagonal(o, o, d["children"]? true:false)
        });
      
      // UPDATE
      let linkUpdate = linkEnter.merge(<any>link);
      
      // Transition back to the parent element position, now draw a link from node to it's parent
      linkUpdate.transition()
          .duration(this.duration);

          	linkUpdate.attr('d', d => {
          	//console.log(d.parent.y);
          	//console.log((d.parent.y == Math.round(d.parent.y))? d.parent.y+(this.height/this.depth*this.multiplier):d.parent.y,"====");
          	//this.multiplier++;
          	return diagonal(d, {x:d.parent.x,y: (d.parent.y != 0 && d.parent.y == Math.round(d.parent.y))? d.parent.y/* +(this.height/this.depth) */:d.parent.y}, d["children"]? true:false);
          });
          	
//          	this.firstTransition = false;

      // Remove any exiting links
      let linkExit = link.exit().transition()
          .duration(this.duration)
          .attr('d', d => {
            let o = {x: source.x, y: source.y}
            return diagonal(o, o, d["children"]? true:false)
          })
          .remove();
      
      // Store the old positions for transition.
      nodes.forEach(function(d){
        d['x0'] = d.x;
        d['y0'] = d.y;
      });
  
    }

    let zoom = () => {
    g.attr('transform', d3.event.transform);
    }

    // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
    let zoomListener = d3.zoom().scaleExtent([0.001, 1000]).on("zoom", zoom); 
    
    //Khaled if you are reading...this was my solution to the crazy link lines :)
    
    let diagonal = (s, d, atNode=true) => {
      let sy = (s.y)// + (this.height/this.depth))
      //let dy = (d.y + (this.height/this.depth*this.multiplier))
      let p = "M" + s.x + "," + sy
        + "C" + s.x + "," + (s.y + d.y) / 2
        + " " + d.x + "," +  (sy + d.y) / 2
        + " " + d.x + "," + d.y;
      //this.depth+=1;
      return p;
    }
    
    this.depth = getDepth(this.data);
    
    //if you use this the zoom will reset but the distance will be dynamic and the scale will be dynamic.
    this.width = this.width*Math.max(1.5 , this.depth/20);
    this.height = this.height*Math.max(1.5 , this.depth/20);

    //if this is static like here it won't zoom out like it does but the initial will be far a bit.
    //this.width = this.width*3;
    //this.height = this.height*3;

    let margin = {top: 20, right: 20, bottom: 30, left: 20};
    let width = this.width - margin.left - margin.right + 400;
    let height = this.height - margin.top - margin.bottom;
    

    let svg = d3.select("#container")
      .append("div")
      .classed("svg-container", true) //container class to make it responsive
      .append("svg")
      //responsive SVG needs these 2 attributes and no width and height attr
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", "0 -60 "+this.width+" "+this.height+"")
      //class to make it responsive
      .classed("svg-content-responsive", true)
      .call(zoomListener)
      ;

    let g = svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");   
      
    //this.depth = getDepth(this.data);     
    let root;
    root = this.data;
    root.isRoot = true;
    root = d3.hierarchy(root);
    root.x0 = 0;
    root.y0 = width / 3;
    draw(root);
    //this.multiplier++;
  }
  ngOnChanges(){
    this.searchText = this.search;
    document.querySelector("div.svg-container").remove();
    //	this.firstTransition = true;
    //this.multiplier = 0;
    this.ngOnInit();
  }
}
