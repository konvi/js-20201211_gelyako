import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ColumnChart {
  subElements = {};
  chartHeight = 50;

  constructor({
                url,
                range: {
                  from = new Date(),
                  to = new Date(),
                } = {},
                label = '',
                link = '',
                value = 0,
              } = {}) {
    this.url = new URL(url, BACKEND_URL);
    this.range = {
      from,
      to
    };
    this.label = label;
    this.link = link;
    this.value = value;

    this.render();
    this.update(this.range.from, this.range.to);
  }

  getColumnBody(data) {
    const maxValue = Math.max(...data);
    const scale = this.chartHeight / maxValue;

    return data
      .map(item => {
        const percent = (item / maxValue * 100).toFixed(0);

        return `<div style="--value: ${Math.floor(item * scale)}" data-tooltip="${percent}%"></div>`;
      })
      .join('');
  }

  getLink() {
    return this.link ? `<a class="column-chart__link" href="${this.link}">View all</a>` : '';
  }

  get template() {
    return `
      <div class="column-chart column-chart_loading" style="--chart-height: ${this.chartHeight}">
        <div class="column-chart__title">
          Total ${this.label}
          ${this.getLink()}
        </div>
        <div class="column-chart__container">
           <div data-element="header" class="column-chart__header">
           </div>
          <div data-element="body" class="column-chart__chart">
          </div>
        </div>
      </div>
    `;
  }

  render() {
    const element = document.createElement('div');
    element.innerHTML = this.template;
    this.element = element.firstElementChild;

    this.subElements = this.getSubElements(this.element);
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  async update(startDate, endDate) {
    this.range.from = startDate;
    this.range.to = endDate;
    this.url.searchParams.set('from', this.range.from.toISOString());
    this.url.searchParams.set('to', this.range.to.toISOString());

    this.element.classList.add('column-chart_loading');
    const json = await fetchJson(this.url);
    this.data = Object.values(json);
    this.value = this.data.reduce((sum, value) => sum += value, 0);

    this._redraw();
  }

  _redraw() {
    if (this.data.length) {
      this.element.classList.remove('column-chart_loading');

      this.subElements.header.textContent = this.value;
      this.subElements.body.innerHTML = this.getColumnBody(this.data);
    }
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
    this.subElements = {};
  }
}
