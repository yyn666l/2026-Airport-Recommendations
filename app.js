"use strict";

const state = {
  catalog: [],
  risk: [],
  sources: [],
  catalogLimit: 24,
  riskLimit: 30,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
const normalize = (value = "") => String(value).toLowerCase().normalize("NFKC").replace(/\s+/g, "");

function statusMeta(record) {
  if (record.status === "conflict-current") return { label: "近期状态存在差异", className: "conflict" };
  if (record.status === "conflict-history") return { label: "历史同名记录待核验", className: "conflict" };
  if (record.status === "candidate-multi") return { label: `${record.sourceCount} 份来源`, className: "" };
  return { label: "单一来源", className: "single" };
}

function firstNumber(value) {
  const match = String(value || "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
}

function compactUnique(values, max = 5) {
  return [...new Set((values || []).filter(Boolean))].slice(0, max);
}

function offerMarkup(record) {
  const offers = (record.offers || []).filter((item) => item.price).slice(0, 3);
  if (!offers.length) return "<p>价格待复核</p>";
  return offers.map((offer) => {
    const source = record.sources.find((item) => item.id === offer.source);
    return `<p><b>${escapeHtml(offer.price)}</b> <span>· ${escapeHtml(source?.label || offer.source)}</span>${offer.coupon ? ` · 优惠码：${escapeHtml(offer.coupon)}` : ""}${offer.conditions ? `<br><small>${escapeHtml(offer.conditions)}</small>` : ""}</p>`;
  }).join("");
}

function reviewMarkup(record) {
  if (!record.review) return "";
  return `<div class="test-note">资料复核 ${escapeHtml(record.review.checkedOn)}：${escapeHtml(record.review.note)}</div>`;
}

function entryMarkup(record) {
  return (record.entryLinks || []).map((entry) => `<p><a href="${escapeHtml(entry.url)}" target="_blank" rel="noreferrer">入口／资料 ↗</a> · 运营主体待核验</p>`).join("");
}

function chipMarkup(items) {
  return compactUnique(items).map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("");
}

function testMarkup(record) {
  const test = record.details?.test;
  if (!test?.collectedAt) return "";
  return `<div class="test-note">历史测试日期：${escapeHtml(test.collectedAt)} · ${escapeHtml(test.entry || "测试入口未记录")}</div>`;
}

function cardMarkup(record) {
  const meta = statusMeta(record);
  const aliases = record.aliases?.length ? `<p class="aliases">其他名称：${escapeHtml(record.aliases.join(" / "))}</p>` : "";
  const primaryPrice = (record.offers || []).find((item) => item.price)?.price || "待复核";
  const chips = [
    ...compactUnique(record.lineTypes, 2),
    ...compactUnique(record.protocols, 2),
    ...compactUnique(record.tags, 2),
  ];
  return `<article class="airport-card">
    <div class="card-top"><div><h3>${escapeHtml(record.name)}</h3>${aliases}</div><span class="status-badge ${meta.className}">${escapeHtml(meta.label)}</span></div>
    <div class="evidence-row"><strong>${escapeHtml(primaryPrice)}</strong><span>${escapeHtml(record.confidence)}</span></div>
    <div class="offer-list">${offerMarkup(record)}</div>
    <div class="chip-row">${chipMarkup(chips)}</div>
    ${testMarkup(record)}
    ${reviewMarkup(record)}
    ${entryMarkup(record)}
    <div class="card-spacer"></div>
    <div class="card-footer"><span>${record.unlock?.length ? `收录 ${record.unlock.length} 项服务访问说明` : "服务访问情况待核验"}</span><span class="source-dots">${record.sources.map((source) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer" title="${escapeHtml(source.label)}">${escapeHtml(source.label)}</a>`).join("")}</span></div>
  </article>`;
}

function filteredCatalog() {
  const query = normalize($("#catalog-search").value);
  const evidence = $("#catalog-evidence").value;
  const line = $("#catalog-line").value;
  const sort = $("#catalog-sort").value;
  const result = state.catalog.filter((record) => {
    const haystack = normalize([record.name, ...(record.aliases || []), ...(record.lineTypes || []), ...(record.protocols || []), ...(record.tags || []), ...(record.unlock || [])].join(" "));
    const matchesQuery = !query || haystack.includes(query);
    const matchesEvidence = evidence === "all"
      || (evidence === "multi" && record.sourceCount >= 2)
      || (evidence === "tested" && record.details?.test?.collectedAt)
      || (evidence === "single" && record.sourceCount === 1)
      || (evidence === "conflict" && record.status.startsWith("conflict"));
    const matchesLine = line === "all" || (record.lineTypes || []).some((item) => normalize(item).includes(normalize(line)));
    return matchesQuery && matchesEvidence && matchesLine;
  });
  if (sort === "name") result.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  if (sort === "price") result.sort((a, b) => firstNumber(a.offers?.[0]?.price) - firstNumber(b.offers?.[0]?.price));
  if (sort === "evidence") result.sort((a, b) => b.sourceCount - a.sourceCount || Number(Boolean(b.details?.test)) - Number(Boolean(a.details?.test)) || a.name.localeCompare(b.name, "zh-CN"));
  return result;
}

function renderCatalog(resetLimit = false) {
  if (resetLimit) state.catalogLimit = 24;
  const records = filteredCatalog();
  $("#catalog-count").textContent = `检索结果：${records.length} 项 · 当前显示 ${Math.min(records.length, state.catalogLimit)} 项`;
  const grid = $("#catalog-grid");
  grid.innerHTML = records.length ? records.slice(0, state.catalogLimit).map(cardMarkup).join("") : $("#empty-template").innerHTML;
  const more = $("#catalog-more");
  more.hidden = records.length <= state.catalogLimit;
  more.textContent = `加载更多（剩余 ${Math.max(0, records.length - state.catalogLimit)} 项）`;
}

function riskMatchesScope(record, scope) {
  if (scope === "all") return true;
  if (scope === "recent") return record.events.some((event) => event.scope === "recent");
  if (scope === "historical") return record.events.some((event) => event.scope === "historical");
  return record.events.some((event) => /恢复|撤回/.test(`${event.status} ${event.summary}`));
}

function filteredRisk() {
  const query = normalize($("#risk-search").value);
  const year = $("#risk-year").value;
  const scope = $("#risk-scope").value;
  return state.risk.filter((record) => {
    const haystack = normalize([record.name, ...(record.aliases || []), ...record.events.flatMap((event) => [event.status, event.summary])].join(" "));
    return (!query || haystack.includes(query))
      && (year === "all" || record.events.some((event) => String(event.year) === year))
      && riskMatchesScope(record, scope);
  });
}

function formalStatus(value) {
  return String(value || "").replace(/[🔴🟠🟢]/gu, "").trim()
    .replace(/已跑路/g, "已停运（来源报告）")
    .replace(/跑路预警/g, "停运风险预警")
    .replace(/跑路/g, "停运或失联（来源报告）")
    .replace(/客服态度及其恶劣/g, "客户服务投诉")
    .replace(/\//g, "／");
}

function riskMarkup(record) {
  const years = [...new Set(record.events.map((event) => event.year).filter(Boolean))].sort((a, b) => b - a);
  const events = record.events.slice(0, 3).map((event) => {
    const recovered = /恢复|撤回/.test(`${event.status} ${event.summary}`);
    return `<div class="risk-event ${recovered ? "recovered" : ""}"><b>${escapeHtml(event.date || event.year || "日期待核验")}</b> · ${escapeHtml(formalStatus(event.status))}${event.summary ? ` — ${escapeHtml(event.summary)}` : ""}</div>`;
  }).join("");
  return `<article class="risk-item">
    <div><h3>${escapeHtml(record.name)}</h3>${record.aliases?.length ? `<small>${escapeHtml(record.aliases.join(" / "))}</small>` : ""}</div>
    <div class="risk-years">${years.join(" · ")}</div>
    <div class="risk-events">${events}${record.events.length > 3 ? `<small>另有 ${record.events.length - 3} 条历史事件</small>` : ""}</div>
    ${reviewMarkup(record)}
    <div class="risk-source">${record.sources.map((source) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.label)} ↗</a>`).join("")}</div>
  </article>`;
}

function renderRisk(resetLimit = false) {
  if (resetLimit) state.riskLimit = 30;
  const records = filteredRisk();
  $("#risk-count").textContent = `检索结果：${records.length} 个主体 · ${records.reduce((total, record) => total + record.events.length, 0)} 条事件`;
  $("#risk-list").innerHTML = records.length ? records.slice(0, state.riskLimit).map(riskMarkup).join("") : $("#empty-template").innerHTML;
  const more = $("#risk-more");
  more.hidden = records.length <= state.riskLimit;
  more.textContent = `加载更多（剩余 ${Math.max(0, records.length - state.riskLimit)} 个主体）`;
}

function renderSources() {
  $("#source-list").innerHTML = state.sources.map((source) => `<article class="source-item"><a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer"><strong>${escapeHtml(source.label)} ↗</strong><span>${escapeHtml(source.kind)}</span></a><time>资料：${escapeHtml(source.asOf)} · 来源更新：${escapeHtml(source.updated)}${source.repositoryCheckedOn ? ` · 仓库检查：${escapeHtml(source.repositoryCheckedOn)}` : ""}</time></article>`).join("");
}

function populateFilters() {
  const lines = [...new Set(state.catalog.flatMap((record) => record.lineTypes || []).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  $("#catalog-line").insertAdjacentHTML("beforeend", lines.map((line) => `<option value="${escapeHtml(line)}">${escapeHtml(line)}</option>`).join(""));
  const years = [...new Set(state.risk.flatMap((record) => record.events.map((event) => event.year)).filter(Boolean))].sort((a, b) => b - a);
  $("#risk-year").insertAdjacentHTML("beforeend", years.map((year) => `<option value="${year}">${year}</option>`).join(""));
}

function setStats() {
  $("#stat-catalog").textContent = state.catalog.length;
  $("#stat-multi").textContent = state.catalog.filter((record) => record.sourceCount >= 2).length;
  $("#stat-tested").textContent = state.catalog.filter((record) => record.details?.test?.collectedAt).length;
  $("#stat-risk").textContent = state.risk.length;
}

function activateTab(name) {
  $$(".nav-link").forEach((button) => { const active = button.dataset.tab === name; button.classList.toggle("is-active", active); button.setAttribute("aria-selected", String(active)); });
  $$(".tab-panel").forEach((panel) => { const active = panel.dataset.panel === name; panel.hidden = !active; panel.classList.toggle("is-active", active); });
  history.replaceState(null, "", `#${name}`);
}

function bindEvents() {
  $$(".nav-link").forEach((button) => button.addEventListener("click", () => activateTab(button.dataset.tab)));
  ["#catalog-search", "#catalog-evidence", "#catalog-line", "#catalog-sort"].forEach((selector) => $(selector).addEventListener("input", () => renderCatalog(true)));
  ["#risk-search", "#risk-year", "#risk-scope"].forEach((selector) => $(selector).addEventListener("input", () => renderRisk(true)));
  $("#catalog-reset").addEventListener("click", () => { $("#catalog-search").value = ""; $("#catalog-evidence").value = "all"; $("#catalog-line").value = "all"; $("#catalog-sort").value = "evidence"; renderCatalog(true); });
  $("#risk-reset").addEventListener("click", () => { $("#risk-search").value = ""; $("#risk-year").value = "all"; $("#risk-scope").value = "all"; renderRisk(true); });
  $("#catalog-more").addEventListener("click", () => { state.catalogLimit += 24; renderCatalog(); });
  $("#risk-more").addEventListener("click", () => { state.riskLimit += 30; renderRisk(); });
}

async function init() {
  try {
    const [catalogResponse, riskResponse] = await Promise.all([fetch("./data/catalog.json"), fetch("./data/risk-history.json")]);
    if (!catalogResponse.ok || !riskResponse.ok) throw new Error("数据文件读取失败");
    const [catalogData, riskData] = await Promise.all([catalogResponse.json(), riskResponse.json()]);
    state.catalog = catalogData.records || [];
    state.risk = riskData.records || [];
    state.sources = catalogData.sources || [];
    populateFilters();
    setStats();
    renderCatalog();
    renderRisk();
    renderSources();
    bindEvents();
    const initialTab = ["catalog", "risk", "method"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "catalog";
    activateTab(initialTab);
  } catch (error) {
    console.error(error);
    $("#catalog-count").textContent = "资料暂时无法加载，请刷新页面或前往 GitHub 查阅数据文件。";
    $("#catalog-grid").innerHTML = `<div class="empty-state"><b>数据加载失败</b><p>${escapeHtml(error.message)}</p></div>`;
  }
}

document.addEventListener("DOMContentLoaded", init);
