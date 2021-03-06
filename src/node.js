import MetaData from './meta_data';
import { classify } from './util';

class Node {
  constructor(data, id, meta_keys, color) {
    this.id = id;
    this.name = data.name;
    this.group = typeof data.group === 'string' ? [data.group] : (data.group || []);
    this.icon = data.icon;
    this.meta = new MetaData(data.meta).get(meta_keys);
    this.extra_class = data.class || '';
    this.color = color;

    this.padding = 3;
    this.tspan_offset = '1.1em';

    this.register(id, data.name);
  }

  register(id, name) {
    Node.all = Node.all || {};
    Node.all[name] = id;
  }

  transform() {
    const x = this.x - this.width / 2 + this.padding;
    const y = this.y - this.height / 2 + this.padding;
    return `translate(${x}, ${y})`;
  }

  node_width() {
    return this.width - 2 * this.padding;
  }

  node_height() {
    return this.height - 2 * this.padding;
  }

  x_for_text() {
    return this.width / 2;
  }

  y_for_text() {
    return this.height / 2;
  }

  static id_by_name(name) {
    if (Node.all[name] === undefined)
      throw `Unknown node "${name}"`;
    return Node.all[name];
  }

  static render(svg, nodes) {

    nodes.forEach(function(node) {
      var sizeText = Node.textSize(node.name);
      node.width = sizeText.width;
      node.height = sizeText.height;
    });

    const container = svg.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('transform', (d) => d.transform());


    container.each(function(d) {
      if (d.icon) {
        d.height = d.width;
        Node.append_image(this);
      }
      else
      {
        d.height += 3 * 2;
        Node.append_rect(this);
      }

      Node.append_text(this);
    });

    return container;
  }

  static append_text(container) {
    const text = d3.select(container).append('text')
      .attr('text-anchor', 'middle')
      .attr('x', (d) => d.x_for_text())
      .attr('y', (d) => d.y_for_text());
    text.append('tspan')
      .text((d) => d.name)
      .attr('x', (d) => d.x_for_text());

      // Отображение loopback
    text.each((d) => {
      Node.append_tspans(text, d.meta);
    });
  }

  static append_tspans(container, meta) {
    meta.forEach((m) => {
      container.append('tspan')
        .attr('x', (d) => d.x_for_text())
        .attr('dy', (d) => d.tspan_offset)
        .attr('class', m.class)
        .text(m.value);
    });
  }

  //метод формирования объекта метаинформайии об узле 
  static getMeta(meta) {
    var metaArr = {};
    meta.forEach((m) => {
      metaArr[m.class] = m.value;
    });
    return metaArr;
  }

  static append_image(container) {
    d3.select(container).attr('class', (d) => `node image ${classify(d.name)} ${d.extra_class}`)
      .append('image')
      .attr('xlink:href', (d) => d.icon)
      .attr('width', (d) => d.node_width())
      .attr('height', (d) => d.node_height());
  }

  static append_rect(container) {
    d3.select(container).attr('class', (d) => `node rect ${classify(d.name)} ${d.extra_class}`)
      .append('rect')
      .attr('width', (d) => d.node_width())
      .attr('height', (d) => d.node_height())
      .attr('rx', 5)
      .attr('ry', 5)
      .style('fill', (d) => d.color());
  }

  static tick(container) {

    container.attr('transform', (d) => d.transform())
    .on('dblclick', function(d) {  //Обрабатываем двойной клик на узле
      d3.event.stopPropagation(); //останавливаем обработку двойного клика в D3 (зум по двойному клику)
      
      var params = Node.getMeta(d.meta); // получаем мета описание узла
      
      if (params.hasOwnProperty('loopback')) {
        window.open(
          'telnet:// /N '+d.name+' /TELNET '+ params.loopback,
          '_blank'
        );
      }
    })
  }

  static set_position(node, position) {
    node.attr('transform', (d, i) => {
      d.x = position[i].x;
      d.y = position[i].y;
      return d.transform();
    });
  }

  static textSize(text) {
    if (!d3) return;
    var container = d3.select('body').append('svg');
    container.append('text').attr({ x: -99999, y: -99999 }).text(text);
    var size = container.node().getBBox();
    container.remove();
    return { width: size.width, height: size.height };
  }
}

module.exports = Node;
