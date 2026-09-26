# 数据来源与判定口径

最后整理：2026-09-26。

## 当前候选来源

| ID | 来源 | 数据日期 | 本项目使用字段 |
| --- | --- | --- | --- |
| yyds | [机场YYDS 30 家档案](https://github.com/jichangyyds-net/jichang-tuijian-shice) | 2026-08-23；仓库更新至 2026-09-15 | 名称、价格、优惠条件、节点数、历史测试与解锁 |
| vpsknow | [VPSKnow 机场索引](https://github.com/everett7623/airport-recommendations-2026) | 2026-09-24 | 名称、线路、起步价、解锁口径与标签 |
| jichangcha | [机场查 32 家镜像](https://github.com/jichangx/2026-jichangcha-tuijian) | 2026-09-25 | 名称、分类、套餐、优惠码与证据等级 |
| signal | [SignalTower 对比表](https://github.com/signaltowers/airport-recommendations-2026) | 2026-07-26 | 名称、线路、协议、解锁、起步价与适用场景 |

当前清单的推荐顺序可能包含编辑判断、联盟关系或商业合作。本项目不沿用排名，只按来源数量、是否有带日期测试和冲突情况展示。

## 风险来源

| ID | 来源 | 数据日期 | 范围 |
| --- | --- | --- | --- |
| limbopro | [Paolujichang](https://github.com/limbopro/Paolujichang) | 仓库更新至 2026-09-14 | 2020–2025 历史停运、预警、恢复和撤回记录 |
| risk2026 | [2025–2026 风险整理](https://github.com/jichang007/paolujichang2026) | 2026-09 | 近期停运、失联与高风险汇总 |
| tizirisk | [机场天梯风险数据库](https://github.com/jichangtianti/airport-status) | 最近表内排查至 2026-08-07 | 探针与社区风险记录 |

风险记录可能出现误报、恢复运营、同名品牌或不同主体复用名称。因此：

1. 历史记录不会被直接改写成当前停运结论。
2. 当前清单与风险名单重名时标记“冲突”，不擅自裁决。
3. 明确写有“已恢复”或“记录撤回”的事件保留原样。
4. 单一入口不可达不会单独作为停运依据。
5. 更正必须带公开链接、日期和主体识别信息。

## 字段限制

- 价格、优惠、倍率和节点数是高频变化字段，下单前必须重新核对。
- “解锁”来自来源的页面口径或历史测试，不保证账号安全和持续可用。
- 多来源收录不是性能评分，也不是购买建议。
- 本项目不收集订阅链接、账号、令牌或私有节点配置。
