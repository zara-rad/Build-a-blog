const puppeteer = require('puppeteer');
const path = require('path');

let browser;
let page;

async function modifyPageLinks(page) {
  await page.$$eval('a', (links) => {
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href.startsWith('/')) {
        link.setAttribute('href', `.${href}`);
      }
    });
  });
}

beforeAll(async () => {
  browser = await puppeteer.launch({ headless: true });
  page = await browser.newPage();
  await page.goto('file://' + path.resolve('./index.html'));
  await modifyPageLinks(page);
});

afterEach((done) => {
  try {
    this.puppeteer.close();
  } catch (e) {}
  done();
}, 30000);

describe('Homepage', () => {
  it('Blog homepage should exist', async () => {
    const content = await page.$eval(
      'body',
      (el) => el.textContent
    );
    expect(content).toMatch(/[a-z]/i);
  });
});

describe('Images', () => {
  it('Each blog post on the homepage should contain an image from the images folder', async () => {
    const postImages = await page.$$eval('img', (el) =>
      Array.from(el).map((img) => img.src)
    );
    expect(postImages).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/images\/.*\.(jpg|png)/),
      ])
    );
  });
});

describe('Post links', () => {
  it('Homepage should contain links to blog posts', async () => {
    const blogPosts = await page.$$eval('a', (el) =>
      Array.from(el).map((a) => a.href)
    );
    expect(blogPosts).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/post.*\.html/),
      ])
    );
  });

  it('Blog post links are pointing to respective post pages', async () => {
    const postLinks = await page.$$eval('a', (el) => Array.from(el).map((a) => a.href));
    const postOne = postLinks.find((el) => el.match(/post-1.html$/));
    await page.goto(postOne);
    const blogContent = await page.$eval('body', (el) => el.textContent);
    
    expect(page.url()).toMatch(/posts\/post-1.html/);
    expect(blogContent).toMatch(/[a-z]/i);
  });
});

describe('Back to Homepage', () => {
  it('Blog posts should contain a link back to the homepage', async () => {
    const backToHomeLink = await page.$$eval('a', (el) =>
      Array.from(el).map((a) => a.href)
    );
    expect(backToHomeLink).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/index\.html/),
      ])
    );
  });
});
