import fs from "fs";
import util from "util";
import process from "child_process";
import { JSDOM } from "jsdom";
import axios from "axios";

const exec = util.promisify(process.exec);

const USER_ID = "184373686577341"; // 掘金用户 ID

// 1. 拉取页面: 使用 cur 拿到 html内容
const { data: body } = await axios.get(
  `https://juejin.cn/user/${USER_ID}/posts`
);

// 2. 使用 jsdom 解析 HTML
const dom = await new JSDOM(body);

// 3. 生成 html
const appendHtmlText = [
  ...dom.window.document.querySelectorAll(
    ".detail-list .post-list-box .entry-list .entry"
  ),
].reduce((total, ele) => {
  const data = ele.querySelector(".jh-timeline-action-area .date")?.textContent;
  const link = ele.querySelector(".content-wrapper .title-row a.title");
  return `${total}\n<li>[${data}] <a href="https://juejin.cn${link?.getAttribute(
    "href"
  )}">${link?.textContent}</a></li>`;
}, "");

// 4. 读取 README, 并在 <!-- posts start --> 和 <!-- posts end --> 中间插入生成的 html
const README_PATH = new URL("./README.md", import.meta.url);
const res = fs
  .readFileSync(README_PATH, "utf-8")
  .replace(
    /(?<=\<\!-- posts start --\>)[.\s\S]*?(?=\<\!-- posts end --\>)/,
    `\n<ul>${appendHtmlText}\n</ul>\n`
  );

// 5. 修改 README
fs.writeFileSync(README_PATH, res);
