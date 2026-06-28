import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface ForecastGaugeProps {
  probability: number; // 0 to 100
}

const ForecastGauge: React.FC<ForecastGaugeProps> = ({ probability }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 300;
    const height = 180;
    const margin = 20;
    const radius = Math.min(width, height * 2) / 2 - margin;

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height - margin})`);

    // Define gradient
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'gauge-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
      
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#10b981'); // Emerald
    gradient.append('stop').attr('offset', '30%').attr('stop-color', '#eab308'); // Yellow
    gradient.append('stop').attr('offset', '60%').attr('stop-color', '#f97316'); // Orange
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#ef4444'); // Red

    // Background arc
    const arc = d3.arc<any, any>()
      .innerRadius(radius - 20)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2)
      .cornerRadius(10);

    svg.append('path')
      .datum({ endAngle: Math.PI / 2 })
      .style('fill', 'url(#gauge-gradient)')
      .style('opacity', 0.2)
      .attr('d', arc as any);

    // Foreground arc (value)
    const angle = -Math.PI / 2 + (probability / 100) * Math.PI;
    
    const foregroundArc = svg.append('path')
      .datum({ endAngle: -Math.PI / 2 })
      .style('fill', 'url(#gauge-gradient)')
      .attr('d', arc as any);

    foregroundArc.transition()
      .duration(1500)
      .ease(d3.easeCubicOut)
      .attrTween('d', (d: any) => {
        const interpolate = d3.interpolate(d.endAngle, angle);
        return (t: number) => {
          d.endAngle = interpolate(t);
          return arc(d) as string;
        };
      });

    // Needle
    const needleLength = radius - 30;
    const needle = svg.append('g')
      .attr('transform', 'rotate(-90)');

    needle.append('path')
      .attr('d', `M 0 -3 L ${needleLength} 0 L 0 3 Z`)
      .style('fill', '#cbd5e1');
    
    needle.append('circle')
      .attr('r', 6)
      .style('fill', '#94a3b8');

    needle.transition()
      .duration(1500)
      .ease(d3.easeCubicOut)
      .attrTween('transform', () => {
        const i = d3.interpolate(-90, -90 + (probability / 100) * 180);
        return (t) => `rotate(${i(t)})`;
      });

    // Center Text
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -20)
      .style('font-size', '36px')
      .style('font-weight', 'bold')
      .style('fill', '#f1f5f9')
      .text('0%')
      .transition()
      .duration(1500)
      .tween('text', function() {
        const i = d3.interpolateRound(0, probability);
        return function(t) {
          d3.select(this).text(`${i(t)}%`);
        };
      });

  }, [probability]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <svg ref={svgRef}></svg>
      <div className="text-sm font-semibold text-slate-400 mt-2 tracking-widest uppercase">
        M+ Flare Probability (6H)
      </div>
    </div>
  );
};

export default ForecastGauge;
