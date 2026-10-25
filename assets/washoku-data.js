"use strict";
// Qualitative preparation-risk judgments; not measured store usage or food-safety ratings.
window.WashokuData = {
  "version": 2,
  "scope": "以中文日料店常见菜单为参考，包含传统、居酒屋、连锁与融合菜式，不声称代表所有门店或日本料理的完整分类。",
  "disclaimer": "风险等级是对普通综合日料店菜单的定性判断：看主要食材或成品是否容易在店外完成制作，不是门店使用率统计、食品安全评级或法规认定。高风险不等于某家店已被证实使用，低风险也不代表全部自制。",
  "categories": [
    {
      "id": "sushi",
      "name": "寿司与刺身",
      "ja": "寿司・刺身",
      "intro": "把鱼料处理、醋饭和最终组装分开看。切得漂亮或当面炙烤，都不能说明此前全部工序。"
    },
    {
      "id": "cold",
      "name": "前菜与凉菜",
      "ja": "前菜・小鉢",
      "intro": "即食小菜可以来自店内制作，也可以来自成袋调味商品；它们不宜与需复热的工业菜肴混用监管口径。"
    },
    {
      "id": "grill",
      "name": "烤物与串烧",
      "ja": "焼き物・串焼き",
      "intro": "看到烤架，能确认最后经过加热；还要问上烤架前是生料、腌料、穿串半成品还是全熟成品。"
    },
    {
      "id": "fried",
      "name": "炸物与热小食",
      "ja": "揚げ物・軽食",
      "intro": "现炸和从头制作不是一回事。清理、调味、成型、裹粉和预炸可能分别在不同地方完成。 这里也收录煎饺与章鱼烧等热小食，它们并非一定油炸。"
    },
    {
      "id": "steam",
      "name": "蛋料理与煮物",
      "ja": "玉子料理・煮物",
      "intro": "区分店内批量备料与外购整品。蒸制、分装、冷藏和出餐复热是不同阶段。"
    },
    {
      "id": "staple",
      "name": "饭与面",
      "ja": "ご飯・麺",
      "intro": "一碗饭或面的各组件来源可以完全不同：面体、汤底、叉烧、咖喱、肉料与最后组装需要分别核实。"
    },
    {
      "id": "soup",
      "name": "汤与锅物",
      "ja": "汁物・鍋",
      "intro": "锅里现场煮熟不代表所有配料从生料开始；汤底、丸滑、酱汁与肉菜原料是不同的问题。"
    },
    {
      "id": "dessert",
      "name": "甜品",
      "ja": "甘味",
      "intro": "甜品常涉及单独生产和供货。外购甜品是否符合你的期待，与它是否属于某一监管定义是两件事。"
    }
  ],
  "focus": {
    "whole": {
      "name": "整品 / 成品路径",
      "short": "优先核实成品",
      "lead": "问是否外购已完成主要制作的成品，门店主要解冻、复热或摆盘。",
      "color": "amber"
    },
    "half": {
      "name": "成型 / 裹粉半成品",
      "short": "优先核实半成品",
      "lead": "问清理、调味、成型或裹粉在哪里完成；现煎现炸不等于从原料做起。",
      "color": "rust"
    },
    "component": {
      "name": "成品配料参与",
      "short": "拆开核实配料",
      "lead": "整道菜可以现场组装，但其中的熟料、酱汁或其他配料可能外购。",
      "color": "olive"
    },
    "onsite": {
      "name": "关键在现场操作",
      "short": "重点看现场工序",
      "lead": "切配、调味、烹调等环节有现场完成路径；仍须问清原料及此前的处理。",
      "color": "blue"
    }
  },
  "dishes": [
    {
      "id": "salmon-sashimi",
      "name": "三文鱼刺身",
      "ja": "サーモン刺身",
      "category": "sushi",
      "focus": "onsite",
      "preparedPath": "可能采购冷冻鱼柳、去皮去骨鱼块或已切片原料，需看实际规格。",
      "onsitePath": "鱼料处理后，门店解冻、修整、切片和摆盘。",
      "ask": "鱼是整柳到店后切，还是已切片到店？",
      "trap": "冷冻或去皮去骨是原料处理，不能直接认定整道刺身为预制菜。",
      "refs": [],
      "aliases": [
        "三文魚",
        "salmon",
        "刺生"
      ],
      "risk": {
        "level": "low",
        "target": "整道刺身；不把冷冻鱼柳算作熟制成品",
        "reason": "主要工作是鱼料解冻、修整与切片，原料冷冻和去骨不等于整菜预制；我不会仅因此把刺身列为重灾区。"
      }
    },
    {
      "id": "tuna-sashimi",
      "name": "金枪鱼刺身",
      "ja": "まぐろ刺身",
      "category": "sushi",
      "focus": "onsite",
      "preparedPath": "可采购冷冻鱼块、切条或预切片鱼料。",
      "onsitePath": "门店按鱼料状态解冻、修整筋膜、切片出餐。",
      "ask": "是鱼块切配还是预切片？不同部位是否分别处理？",
      "trap": "鱼块超低温储存与工业熟制菜肴是不同概念。",
      "refs": [],
      "aliases": [
        "吞拿鱼",
        "鮪",
        "tuna"
      ],
      "risk": {
        "level": "low",
        "target": "整道刺身；区分鱼块与预切片",
        "reason": "采购超低温鱼块属于原料链，门店仍可现场修切；风险重点是预切规格，不是整道熟制菜复热。"
      }
    },
    {
      "id": "sweet-shrimp",
      "name": "甜虾刺身",
      "ja": "甘えび",
      "category": "sushi",
      "focus": "onsite",
      "preparedPath": "可采购带壳或去壳的冷冻生虾规格。",
      "onsitePath": "解冻、去壳、整理并摆盘；也可店内处理完整虾。",
      "ask": "虾到店时是否已去壳？能说明原料规格吗？",
      "trap": "去壳冷冻不等于熟制；“生食”也不能只凭名称或冷冻状态确认。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "low",
        "target": "整道刺身；区分生虾原料的处理深度",
        "reason": "去壳、冷冻主要改变原料规格，摆盘前没有复杂熟制可被成品替代，因此整菜预制的判断优先级较低。"
      }
    },
    {
      "id": "surf-clam",
      "name": "北极贝刺身",
      "ja": "ほっき貝",
      "category": "sushi",
      "focus": "component",
      "preparedPath": "所用贝料可能已经过熟制、开壳或分切，再冷冻配送。",
      "onsitePath": "门店解冻、切片、搭配与摆盘。",
      "ask": "这款贝料到店时是生的还是已熟制？是否已切片？",
      "trap": "菜单写“刺身”不自动代表所有贝类都是未经加热的生原料。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "贝肉预熟、开壳与分切",
        "reason": "贝肉可能在供货前已完成熟制和分切，到店后主要解冻摆盘；这更像加工水产原料，需与调味成菜分开。"
      }
    },
    {
      "id": "nigiri",
      "name": "生鱼握寿司",
      "ja": "握り寿司",
      "category": "sushi",
      "focus": "onsite",
      "preparedPath": "鱼料可提前切配，醋饭也需要备料；采购规格因店而异。",
      "onsitePath": "调制醋饭、切鱼、握制并调味。",
      "ask": "是点单后握制吗？鱼片和醋饭分别在哪里准备？",
      "trap": "有提前备料不等于整只寿司是外购成品；也不能凭“手握”推断全部配料自制。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "low",
        "target": "整只寿司；生鱼料与握制分别看",
        "reason": "生鱼握寿司的切片、醋饭组合与握制容易在店内完成；不能因鱼料冷冻就推断整只寿司是成品。"
      }
    },
    {
      "id": "unagi-nigiri",
      "name": "鳗鱼握寿司",
      "ja": "うなぎ握り",
      "category": "sushi",
      "focus": "component",
      "preparedPath": "可用已蒲烧的鳗鱼熟料，再切片复热或炙烤。",
      "onsitePath": "醋饭和鳗鱼组装，按需炙烤、刷汁。",
      "ask": "鳗鱼是外购蒲烧熟料还是店内从生鳗制作？",
      "trap": "现握、现炙烤描述的是最后一步，不代表鳗鱼在店内从头蒲烧。",
      "refs": [
        "eel"
      ],
      "aliases": [
        "炙烤鳗鱼寿司"
      ],
      "risk": {
        "level": "high",
        "target": "鳗鱼熟料；不等于整只寿司外购",
        "reason": "我把主要鱼料列为高风险：蒲烧可在供货前做完，门店切片或炙烤后握制即可；现场握寿司不能证明鳗鱼自制。"
      }
    },
    {
      "id": "california-roll",
      "name": "加州卷 / 蟹柳卷",
      "ja": "カリフォルニアロール",
      "category": "sushi",
      "focus": "component",
      "preparedPath": "蟹柳是加工配料；搭配的酱、鱼籽也可能是成品。",
      "onsitePath": "醋饭、海苔、蔬菜和配料在店内卷制切段。",
      "ask": "卷是现卷吗？蟹柳、鱼籽和酱分别是什么来源？",
      "trap": "现场卷制可以与工业化配料同时存在；蟹柳不等于整块蟹腿肉。",
      "refs": [
        "kani"
      ],
      "aliases": [
        "反卷",
        "California roll"
      ],
      "risk": {
        "level": "medium",
        "target": "蟹柳、鱼籽和酱；不等于整卷成品",
        "reason": "蟹柳本身就是加工配料，但卷制仍可现场完成。这里的风险在配料来源，不能直接升级为整卷预制。"
      }
    },
    {
      "id": "inari",
      "name": "豆皮寿司",
      "ja": "いなり寿司",
      "category": "sushi",
      "focus": "component",
      "preparedPath": "可采购已调味的油豆腐皮，或采购整只成品。",
      "onsitePath": "店内煮制豆皮、调醋饭后填装；也可只做最后填装。",
      "ask": "豆皮是自行调味还是成品？整只是否在店内填装？",
      "trap": "只看到店内装饭，仍不能说明豆皮是否自制。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "调味豆皮；另查是否整只供货",
        "reason": "豆皮调味可由供应商完成，门店填醋饭仍有现场组装；先查豆皮与整只成品两条路径，不一概判整品。"
      }
    },
    {
      "id": "gunkan",
      "name": "鱼籽军舰寿司",
      "ja": "軍艦巻き",
      "category": "sushi",
      "focus": "component",
      "preparedPath": "鱼籽或调味海鲜可作为成品配料采购。",
      "onsitePath": "用醋饭和海苔成型，再加入配料。",
      "ask": "鱼籽是调味成品吗？军舰是点单后制作吗？",
      "trap": "鱼籽配料的来源与整只寿司的制作方式要分别记录。",
      "refs": [],
      "aliases": [
        "飞鱼籽",
        "蟹籽",
        "tobiko"
      ],
      "risk": {
        "level": "medium",
        "target": "鱼籽或调味海鲜浇头",
        "reason": "成品浇头能替代调味处理，但军舰的醋饭与围海苔仍可现做；应重点看上面的料，不是把整只军舰一并定性。"
      }
    },
    {
      "id": "wakame",
      "name": "中华海草 / 芝麻海藻",
      "ja": "ごまわかめ",
      "category": "cold",
      "focus": "whole",
      "preparedPath": "有调味海藻商品可采购，门店可能主要负责解冻和分装。",
      "onsitePath": "也可由海藻原料在店内处理、调味和拌制。",
      "ask": "海草是整袋已调味成品，还是店里用原料调拌？",
      "trap": "即食冷菜存在成品供货，不等于它与需加热的预包装菜肴属于同一法规分类。",
      "refs": [
        "seaweed"
      ],
      "aliases": [
        "海草沙拉",
        "裙带菜",
        "wakame"
      ],
      "risk": {
        "level": "high",
        "target": "整份调味海藻小菜",
        "reason": "我会优先按袋装成品方向判断：切配和调味可在供货前完成，门店解冻、分装便能出餐，自制替代的工序多。"
      }
    },
    {
      "id": "tako-wasabi",
      "name": "芥末章鱼",
      "ja": "たこわさび",
      "category": "cold",
      "focus": "whole",
      "preparedPath": "可有已切粒、调味的海鲜成品路径，需确认实际商品与熟制状态。",
      "onsitePath": "店内处理章鱼、配制调味并冷藏备料。",
      "ask": "是已调味成品分装，还是店内切配拌制？",
      "trap": "“凉菜”不代表必然生食或熟制，要看具体产品和工艺。",
      "refs": [
        "octopus"
      ],
      "aliases": [
        "章鱼芥末",
        "tako wasabi"
      ],
      "risk": {
        "level": "high",
        "target": "整份芥末章鱼小菜",
        "reason": "章鱼处理、切粒、拌酱可被一份调味商品整体替代，门店摆盘即可；这是我会优先查包装的小菜。"
      }
    },
    {
      "id": "seasoned-whelk",
      "name": "味付螺肉 / 海螺片",
      "ja": "味付け貝",
      "category": "cold",
      "focus": "whole",
      "preparedPath": "可采购已经熟制、切片并调味的贝类商品。",
      "onsitePath": "门店煮制贝类、切片、调味后备餐。",
      "ask": "贝料到店时已熟制调味了吗？",
      "trap": "鲜切外观和盘饰不能证明熟制调味是在店内完成。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "整份调味螺肉",
        "reason": "熟制、切片和入味可在外部集中完成，冷盘上桌只需解冻分装；主要制作很容易全部外移。"
      }
    },
    {
      "id": "edamame",
      "name": "盐水毛豆",
      "ja": "枝豆",
      "category": "cold",
      "focus": "component",
      "preparedPath": "可采购冷冻原料或已加热、调味的毛豆；加工状态需看标签。",
      "onsitePath": "门店用原料煮熟、加盐、冷却或热食出餐。",
      "ask": "毛豆是生冻、焯过还是全熟调味？店里还做哪一步？",
      "trap": "不能把所有冷冻蔬菜都等同于整菜预制。",
      "refs": [],
      "aliases": [
        "edamame"
      ],
      "risk": {
        "level": "medium",
        "target": "是否为已熟制调味毛豆",
        "reason": "冷冻生毛豆和熟制调味毛豆都能快速出餐，但店内水煮也很简单。单看冷冻或出餐快，不足以列最高风险。"
      }
    },
    {
      "id": "potato-salad",
      "name": "日式土豆沙拉",
      "ja": "ポテトサラダ",
      "category": "cold",
      "focus": "whole",
      "preparedPath": "存在餐饮用土豆沙拉商品，可以作为成品分装。",
      "onsitePath": "店内煮土豆、拌蛋黄酱和配料，按批次冷藏。",
      "ask": "土豆沙拉是店内拌制还是外购成品？",
      "trap": "自制也可能提前批量做；外购与“非点单现拌”不是同一个问题。",
      "refs": [
        "potato"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "整份土豆沙拉",
        "reason": "蒸煮、压拌、调味等费工步骤都可由成品沙拉替代，到店后挖取装盘即可，我会把它列入重点。"
      }
    },
    {
      "id": "sesame-tofu",
      "name": "胡麻豆腐",
      "ja": "胡麻豆腐",
      "category": "cold",
      "focus": "whole",
      "preparedPath": "可有成型冷藏/常温商品，门店再配汁装盘。",
      "onsitePath": "店内以芝麻等原料加热成型、冷却并配汁。",
      "ask": "豆腐本体是店内熬制成型，还是成品切块？",
      "trap": "胡麻豆腐与普通大豆豆腐并非同一做法，不能凭“豆腐”二字判断。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "已成型的胡麻豆腐本体",
        "reason": "芝麻研磨、调浆和凝固定型可整段外移，店内切块配汁就能完成出餐；比普通冷豆腐更值得查成品来源。"
      }
    },
    {
      "id": "pickles",
      "name": "腌萝卜 / 渍物",
      "ja": "漬物",
      "category": "cold",
      "focus": "whole",
      "preparedPath": "可采购已经腌制、切片的成品渍物。",
      "onsitePath": "店内腌渍并记录批次，再切配。",
      "ask": "是店内腌制还是采购成品？",
      "trap": "腌渍本来就需要提前进行；“非现做”不自动等于工业预制菜。",
      "refs": [],
      "aliases": [
        "日式泡菜",
        "腌黄瓜",
        "沢庵"
      ],
      "risk": {
        "level": "high",
        "target": "腌制完成的渍物本体",
        "reason": "腌制与入味可在供货前全部完成，店内往往只剩切片或摆盘；我会按外购即食成品高风险看待。"
      }
    },
    {
      "id": "hiyayakko",
      "name": "冷豆腐",
      "ja": "冷奴",
      "category": "cold",
      "focus": "component",
      "preparedPath": "豆腐本体、柴鱼片和酱油等可分别外购。",
      "onsitePath": "门店切豆腐，配姜葱和调味出餐。",
      "ask": "豆腐与配汁分别自制还是采购？",
      "trap": "现切摆盘与配料外购可以同时成立，不必把整道菜硬分成两个极端。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "low",
        "target": "整道冷豆腐；外购普通豆腐另记",
        "reason": "买豆腐、柴鱼片和酱油不等于购买整份做好的菜，门店切配组合就能完成；不把基础食品自动算整菜预制。"
      }
    },
    {
      "id": "kabayaki",
      "name": "蒲烧鳗鱼",
      "ja": "うなぎ蒲焼",
      "category": "grill",
      "focus": "whole",
      "preparedPath": "可采购已熟制、带汁的蒲烧鳗鱼，门店复热、刷汁或再烤。",
      "onsitePath": "从处理生鳗开始串制、蒸烤和刷汁，依具体流派进行。",
      "ask": "鳗鱼到店时是生料、白烧还是蒲烧全熟？",
      "trap": "有炙烤香气也可能只是复烤；不要只看最后一次刷汁。",
      "refs": [
        "eel"
      ],
      "aliases": [
        "烤鳗鱼",
        "kabayaki"
      ],
      "risk": {
        "level": "high",
        "target": "已完成蒲烧的鳗鱼",
        "reason": "杀鱼、处理和蒲烧是主要技术工序，熟制真空鳗鱼能整体替代它们；到店复烤刷汁仍可能只是最后加热。"
      }
    },
    {
      "id": "saba-shio",
      "name": "盐烤青花鱼",
      "ja": "さば塩焼き",
      "category": "grill",
      "focus": "onsite",
      "preparedPath": "可采购生鱼片、已腌鱼片或已烤熟的商品。",
      "onsitePath": "门店修整、盐腌并从未熟鱼料烤熟。",
      "ask": "青花鱼上烤架前是生鱼、腌料还是已烤熟？",
      "trap": "切好的冷冻鱼片与全熟复热鱼是不同供餐路径。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "鱼片是生料、腌料还是熟品",
        "reason": "预腌鱼片与全熟烤鱼的加工深度差别很大，而生鱼现烤也容易实现；我会列中风险，先核实上烤架前状态。"
      }
    },
    {
      "id": "sanma",
      "name": "盐烤秋刀鱼",
      "ja": "さんま塩焼き",
      "category": "grill",
      "focus": "onsite",
      "preparedPath": "可以整鱼或处理过的冷冻鱼料到店，也可能用熟制商品。",
      "onsitePath": "处理鱼体、盐腌，再烤制出餐。",
      "ask": "是否从未熟鱼料开始烤？",
      "trap": "冷冻储存本身不足以判断整道烤鱼是否预制。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "low",
        "target": "整道烤鱼；不把冷冻整鱼算熟菜",
        "reason": "从整鱼或处理过的生鱼烤熟，核心烹调可以在店内完成；仅靠冷冻储运没有足够理由列为预制重灾区。"
      }
    },
    {
      "id": "teriyaki-chicken",
      "name": "照烧鸡肉",
      "ja": "照り焼きチキン",
      "category": "grill",
      "focus": "half",
      "preparedPath": "可采购腌好鸡肉或已熟制带汁鸡肉；要区别二者。",
      "onsitePath": "店内处理生鸡肉、煎烤并收汁。",
      "ask": "是生腌肉现场烤，还是熟制鸡肉复热收汁？",
      "trap": "现浇酱汁不能证明肉在店内从生料做起。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "鸡肉预腌还是已熟制带汁",
        "reason": "腌制和酱汁容易标准化，整块鸡肉现场煎烤也不复杂；关键在熟制是否外移，不能只因照烧酱判高风险。"
      }
    },
    {
      "id": "yakitori",
      "name": "鸡肉串烧",
      "ja": "焼き鳥",
      "category": "grill",
      "focus": "half",
      "preparedPath": "可采购已切分穿串、调味或已熟制的不同规格。",
      "onsitePath": "店内分切鸡肉、穿串，再盐烤或酱烤。",
      "ask": "鸡串在哪里切肉穿串？到店前是否熟制？",
      "trap": "现烤能说明加热环节，不能单独说明穿串和调味环节。",
      "refs": [],
      "aliases": [
        "烧鸟",
        "yakitori"
      ],
      "risk": {
        "level": "medium",
        "target": "切肉穿串、预腌与预熟",
        "reason": "半成品能替代分切穿串，但烤制也可能从生肉开始；普通鸡肉串的判断要低于已调馅成型的肉丸。"
      }
    },
    {
      "id": "tsukune",
      "name": "鸡肉丸串 / 月见肉丸",
      "ja": "つくね",
      "category": "grill",
      "focus": "half",
      "preparedPath": "肉糜调味、成型和预熟都可能由供应商完成。",
      "onsitePath": "店内绞肉调味、成丸，再烤熟与配汁。",
      "ask": "肉丸是店内调馅成型吗？采购时生熟状态是什么？",
      "trap": "浇上蛋黄或刷酱只是组装，不能证明肉丸自制。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "肉糜调馅、成型和可能的预熟",
        "reason": "绞肉、配方调馅、成丸这些劳动密集步骤容易由标准半成品替代，门店只烤熟或复烤；我会重点查肉丸。"
      }
    },
    {
      "id": "mentaiko-potato",
      "name": "明太子焗土豆",
      "ja": "明太子ポテト",
      "category": "grill",
      "focus": "component",
      "preparedPath": "明太子酱、薯泥或芝士可为成品配料。",
      "onsitePath": "门店处理土豆，拌料并焗烤。",
      "ask": "土豆或薯泥和明太子酱分别怎么准备？",
      "trap": "表面现焗不代表底料没有使用成品。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "明太子酱和土豆泥",
        "reason": "配料和薯泥可以外购，但土豆处理与焗烤也可现场完成；需要查主料，而不是看到瓶装酱就断言整道预制。"
      }
    },
    {
      "id": "beef-tongue",
      "name": "烤牛舌",
      "ja": "牛タン",
      "category": "grill",
      "focus": "onsite",
      "preparedPath": "可采购原块、预切片或已经腌制的牛舌。",
      "onsitePath": "门店修整、切片、调味和烤制。",
      "ask": "是原块修切、切片原料还是调味半成品？",
      "trap": "预切不是熟制；也不能凭切片厚度整齐判断一定预制。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "low",
        "target": "整道烤牛舌；预切预腌另记",
        "reason": "牛舌的主要熟制仍可发生在烤架上，预切片属于原料规格；相对成型肉丸，整道熟品复热的疑点较低。"
      }
    },
    {
      "id": "karaage",
      "name": "唐扬鸡块",
      "ja": "鶏の唐揚げ",
      "category": "fried",
      "focus": "half",
      "preparedPath": "有餐饮用唐扬/炸鸡商品；可能预腌裹粉，也可能已预炸或全熟。",
      "onsitePath": "门店切鸡肉、腌制、裹粉，再炸熟。",
      "ask": "鸡块是店内腌裹，还是半成品/全熟品下锅复炸？",
      "trap": "现炸只说明最后加热方式，生熟状态需看具体商品。",
      "refs": [
        "chicken"
      ],
      "aliases": [
        "日式炸鸡",
        "karaage"
      ],
      "risk": {
        "level": "high",
        "target": "腌制裹粉鸡块；可能生制或已熟制",
        "reason": "预腌、裹粉的半成品可以直接入油锅，省去主要备料工序；已经有未加热商品例证，不能把“现炸”当作全程自制。"
      }
    },
    {
      "id": "tonkatsu",
      "name": "炸猪排",
      "ja": "とんかつ",
      "category": "fried",
      "focus": "half",
      "preparedPath": "可采购已分切、调味和裹面包糠的猪排。",
      "onsitePath": "门店处理肉块、拍松、调味、裹粉并炸制。",
      "ask": "猪排在哪里裹粉？是整块肉还是重组/成型商品？",
      "trap": "现炸外壳酥脆不等于店内从原肉制作。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "已处理和裹糠的猪排",
        "reason": "分切、拍松、调味和裹糠均可在店外完成，门店只负责炸熟；我会把预裹粉猪排作为主要核查对象。"
      }
    },
    {
      "id": "ebi-fry",
      "name": "面包糠炸虾",
      "ja": "海老フライ",
      "category": "fried",
      "focus": "half",
      "preparedPath": "可采购去头去壳、拉直并裹面包糠的虾制品。",
      "onsitePath": "门店处理虾、裹粉，再炸制。",
      "ask": "虾是否已经去壳拉直裹粉？到店时是否预炸？",
      "trap": "“炸虾”有不同加工深度，不能仅凭形状判断。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "去壳拉直、裹面包糠的虾",
        "reason": "处理虾和裹糠费工，采购已成型半成品能直接省去这些步骤；现炸只能确认最后熟制，不能排除预制。"
      }
    },
    {
      "id": "korokke",
      "name": "可乐饼",
      "ja": "コロッケ",
      "category": "fried",
      "focus": "half",
      "preparedPath": "存在已成型的业务用可乐饼商品，炸制可在门店完成。",
      "onsitePath": "店内蒸煮土豆、拌馅、成型、裹粉，再炸。",
      "ask": "馅料与成型裹粉是在店里完成的吗？",
      "trap": "商品可有不同加热要求，不能一概当作全熟复热。",
      "refs": [
        "croquette"
      ],
      "aliases": [
        "土豆可乐饼",
        "蟹肉可乐饼",
        "korokke"
      ],
      "risk": {
        "level": "high",
        "target": "土豆馅、成型与裹粉",
        "reason": "蒸土豆、调馅、成型和裹粉可被成型商品整段替代，门店只炸制；这是我判断的典型半成品重灾区。"
      }
    },
    {
      "id": "tempura",
      "name": "天妇罗",
      "ja": "天ぷら",
      "category": "fried",
      "focus": "onsite",
      "preparedPath": "可从原料现裹面糊，也可能用已裹衣/预炸冷冻品。",
      "onsitePath": "门店处理海鲜蔬菜，调面糊后裹炸。",
      "ask": "是原料现裹面糊，还是已经裹衣的半成品？",
      "trap": "现炸不能排除预制裹衣；但也不能把所有天妇罗都贴同一标签。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "是否预裹衣或预炸；分清虾与蔬菜",
        "reason": "预裹衣商品能替代前处理，但原料现调面糊现炸也直接。不同食材差别大，不能把全部天妇罗归为最高风险。"
      }
    },
    {
      "id": "ika-rings",
      "name": "炸鱿鱼圈",
      "ja": "いかリングフライ",
      "category": "fried",
      "focus": "half",
      "preparedPath": "可采购预切圈、裹粉圈或预炸成品等规格。",
      "onsitePath": "店内切鱿鱼、调味、裹粉并炸制。",
      "ask": "鱿鱼圈是原切、已裹粉还是已预炸？",
      "trap": "预切原料与裹粉半成品不应混为一类。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "已裹粉的鱿鱼圈；原切圈另看",
        "reason": "预切加裹粉能把主要加工移到供应商，门店直接炸；我会优先查裹粉半成品，不把仅预切的原料混进去。"
      }
    },
    {
      "id": "oyster-fry",
      "name": "炸牡蛎",
      "ja": "カキフライ",
      "category": "fried",
      "focus": "half",
      "preparedPath": "可有清理、裹面包糠后的冷冻牡蛎商品。",
      "onsitePath": "门店处理牡蛎、裹粉和炸制。",
      "ask": "牡蛎上桌前的裹粉、熟制分别在哪完成？",
      "trap": "仅凭出餐快不能确认工业半成品；门店也会提前备料。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "清理和裹面包糠的牡蛎",
        "reason": "牡蛎清理、沥水与裹糠可由供货端完成，入店后炸熟即可，具备主要工序被半成品替代的特征。"
      }
    },
    {
      "id": "cheese-stick",
      "name": "炸芝士条",
      "ja": "チーズフライ",
      "category": "fried",
      "focus": "half",
      "preparedPath": "芝士切条、包裹、裹粉或预炸可以由供应商完成。",
      "onsitePath": "店内切芝士、包裹裹粉后炸制。",
      "ask": "芝士条是店内包裹裹粉吗？",
      "trap": "半成品不同于“坏食材”，研究重点是实际工序是否透明。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "成型包裹并裹粉的芝士条",
        "reason": "包裹、定型和裹粉能在工厂集中完成，门店只需炸制；主要价值不在最终几分钟下锅。"
      }
    },
    {
      "id": "chawanmushi",
      "name": "茶碗蒸",
      "ja": "茶碗蒸し",
      "category": "steam",
      "focus": "onsite",
      "preparedPath": "可用配制蛋液、汤底或杯装成品；制作层次不同。",
      "onsitePath": "店内调蛋液与出汁，装料后蒸制。",
      "ask": "蛋液在哪里调配？是现蒸生蛋液还是成品蒸热？",
      "trap": "门店提前调液或批量蒸制，不等于外购整杯工业成品。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "杯装成品还是店内调液现蒸",
        "reason": "杯装熟品能复热出餐，但店内批量调蛋液和蒸制也直接；我会先列中风险，避免把提前备料误判为外购成品。"
      }
    },
    {
      "id": "tamagoyaki",
      "name": "玉子烧 / 厚烧蛋",
      "ja": "玉子焼き",
      "category": "steam",
      "focus": "whole",
      "preparedPath": "已有餐饮用玉子烧商品，也可采购配制蛋液后在店内煎制。",
      "onsitePath": "店内调蛋液，分层卷煎、切块。",
      "ask": "是店里用蛋液卷煎，还是成品解冻切片？",
      "trap": "把成品切得整齐，或加一层炙烤，都不能说明从蛋液开始制作。",
      "refs": [
        "egg"
      ],
      "aliases": [
        "厚烧玉子",
        "厚烧蛋",
        "tamagoyaki"
      ],
      "risk": {
        "level": "high",
        "target": "已卷煎成型的厚烧蛋",
        "reason": "分层卷煎是核心技术和耗工环节，餐饮用成品能直接替代；解冻切片、加炙烤仍不等于店内卷煎。"
      }
    },
    {
      "id": "beef-stew",
      "name": "日式炖牛肉",
      "ja": "ビーフシチュー",
      "category": "steam",
      "focus": "whole",
      "preparedPath": "有整袋熟制炖菜的供餐路径，也可由门店提前炖制。",
      "onsitePath": "门店处理肉与蔬菜、炖煮并按批次备餐。",
      "ask": "是店内炖好分装，还是采购整袋熟制品？",
      "trap": "长时炖煮本来就常需提前准备，出餐复热不能单独判定外购。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "整袋熟制炖菜与店内批量炖煮",
        "reason": "长时炖煮适合集中制作和分装，但门店自己提前炖同样合理；有复热过程不能直接推出外购，因此保留中风险。"
      }
    },
    {
      "id": "oden",
      "name": "关东煮",
      "ja": "おでん",
      "category": "steam",
      "focus": "component",
      "preparedPath": "鱼丸、竹轮等多是加工配料，整锅汤底或整品也可能外购。",
      "onsitePath": "门店选择配料、熬汁并煮透，控制火候。",
      "ask": "配料、汤底和煮制分别如何准备？",
      "trap": "用加工鱼糜配料并不等于整锅从工厂直接复热。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "鱼糜成型配料与汤底",
        "reason": "竹轮、鱼丸等加工配料值得查，但煮制与调汤可能在店内完成；配料工业化不代表整锅来自成品袋。"
      }
    },
    {
      "id": "agedashi",
      "name": "扬出豆腐",
      "ja": "揚げ出し豆腐",
      "category": "steam",
      "focus": "onsite",
      "preparedPath": "可用普通豆腐现裹粉，也可能采购已炸豆腐。",
      "onsitePath": "门店处理豆腐、裹粉炸制，再配汁。",
      "ask": "豆腐是现场裹粉炸，还是炸好的成品复热？",
      "trap": "现浇出汁只是最终组装，不能反推豆腐此前的处理。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "low",
        "target": "整道豆腐菜；重点确认是否现炸",
        "reason": "普通豆腐裹粉炸制即可完成主要工序，现场制作路径较直接；采购豆腐和酱汁不足以列为整菜预制重灾区。"
      }
    },
    {
      "id": "nizakana",
      "name": "日式煮鱼",
      "ja": "煮魚",
      "category": "steam",
      "focus": "whole",
      "preparedPath": "可采购带汁熟制鱼块，或用生鱼在店内煮制。",
      "onsitePath": "调汁、处理鱼料、煮制并入味。",
      "ask": "鱼是生料入汁煮，还是带汁熟制品复热？",
      "trap": "提前入味与工厂熟制不是同一维度；要问制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "带汁熟制鱼与店内提前煮鱼",
        "reason": "带汁成品能复热出餐，但煮鱼本来就需要提前入味；两条路径都合理，我会查包装而不凭出餐速度判高。"
      }
    },
    {
      "id": "unadon",
      "name": "鳗鱼饭",
      "ja": "うな丼",
      "category": "staple",
      "focus": "component",
      "preparedPath": "既有独立蒲烧鳗鱼熟料，也有连米饭一起的冷冻鳗鱼饭商品；店内组装与整餐复热需要区分。",
      "onsitePath": "店内煮饭，处理或复烤鳗鱼后组装。",
      "ask": "鳗鱼到店前是否已经蒲烧？饭是否在店内煮？",
      "trap": "现煮饭、现刷汁不代表鳗鱼从生料在店内制作；熟鳗鱼不等于整碗饭成品。",
      "refs": [
        "eel",
        "eel-rice"
      ],
      "aliases": [
        "鳗鱼丼",
        "鳗鱼盖饭",
        "unadon"
      ],
      "risk": {
        "level": "high",
        "target": "主要指蒲烧鳗鱼；米饭另判",
        "reason": "这碗饭最有价值的鱼料可采购全熟蒲烧，再复烤铺到现煮饭上；所以主料列高风险，不等于整碗饭都是料理包。"
      }
    },
    {
      "id": "curry-rice",
      "name": "日式咖喱饭",
      "ja": "カレーライス",
      "category": "staple",
      "focus": "component",
      "preparedPath": "咖喱可能是料理包、浓缩基底，或由咖喱块加原料制作。",
      "onsitePath": "店内煮饭，煮咖喱与肉菜后装盘。",
      "ask": "咖喱是整包熟制酱、基底加料，还是店内炖制？",
      "trap": "用了工业咖喱块是使用调味基底，不自动等于整盘饭为工业成品。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "肉菜咖喱浇头；区分咖喱块和熟制整包",
        "reason": "熟制咖喱包能替代炖煮，但用咖喱块加肉菜自己煮也是另一条路径；仅有工业调味基底不足以判整菜高风险。"
      }
    },
    {
      "id": "katsu-curry",
      "name": "猪排咖喱饭",
      "ja": "カツカレー",
      "category": "staple",
      "focus": "component",
      "preparedPath": "猪排半成品、咖喱酱与米饭可分别采购或制作。",
      "onsitePath": "煮饭、处理咖喱、现炸猪排并组装。",
      "ask": "猪排是否现裹粉？咖喱是成品还是店内煮？",
      "trap": "要按猪排、酱和饭三项分别记，不能只凭“现炸”下整体结论。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "优先看预裹糠猪排；咖喱与饭分别看",
        "reason": "主菜猪排可用已裹粉半成品直接炸，咖喱又可能另有成品路径；我会重点查猪排，不能因现炸现装盘就排除。"
      }
    },
    {
      "id": "gyudon",
      "name": "牛丼 / 牛肉饭",
      "ja": "牛丼",
      "category": "staple",
      "focus": "component",
      "preparedPath": "牛肉浇头可为成袋熟制料，也可使用生切片现场煮。",
      "onsitePath": "店内煮饭，以生肉、洋葱和调味汁煮浇头。",
      "ask": "牛肉是生切片现场煮，还是熟制浇头复热？",
      "trap": "米饭现煮与牛肉料是否外购不矛盾。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "牛肉浇头是否熟制供货",
        "reason": "熟制牛肉包能省去煮浇头，但生切片加洋葱现场煮也很直接；不因连锁式装盘就认定是料理包。"
      }
    },
    {
      "id": "oyakodon",
      "name": "亲子丼",
      "ja": "親子丼",
      "category": "staple",
      "focus": "onsite",
      "preparedPath": "可用配制丼汁和分切鸡肉，也可能有熟制浇头路径。",
      "onsitePath": "店内以鸡肉、洋葱和蛋按份煮制，配米饭。",
      "ask": "鸡肉与蛋是点单后同煮吗？鸡肉是否已熟制？",
      "trap": "购买调味汁与购买整份熟浇头是不同加工深度。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "low",
        "target": "鸡肉和蛋的主要熟制",
        "reason": "按份把鸡肉与蛋同煮就能完成核心烹调，现场制作路径直接；预配丼汁不足以把整碗饭列为预制重灾区。"
      }
    },
    {
      "id": "ramen",
      "name": "日式拉面",
      "ja": "ラーメン",
      "category": "staple",
      "focus": "component",
      "preparedPath": "面条、浓缩汤底、叉烧、溏心蛋可分别采购；也有整份便捷方案。",
      "onsitePath": "店内熬汤或调汤、煮面、处理浇头并组装。",
      "ask": "汤是店内熬还是浓缩汤底调配？叉烧、蛋和面分别怎么做？",
      "trap": "只问“拉面是不是现做”太笼统；现煮面不能证明汤和叉烧自制。",
      "refs": [],
      "aliases": [
        "豚骨拉面",
        "味噌拉面",
        "ramen"
      ],
      "risk": {
        "level": "medium",
        "target": "浓缩汤底、叉烧、蛋；面条另记",
        "reason": "汤底和熟浇头可以替代店内长时间熬煮与卤制，值得重点问；但也有自熬自制路径，不把所有拉面都判整碗成品。"
      }
    },
    {
      "id": "udon",
      "name": "乌冬面",
      "ja": "うどん",
      "category": "staple",
      "focus": "component",
      "preparedPath": "有已制成的冷冻乌冬面体；汤汁、浇头与组装是另一层工序。",
      "onsitePath": "店内制作或采购面体，再煮面、调汤和配料。",
      "ask": "乌冬面体是什么规格？汤和浇头是在店内制作的吗？",
      "trap": "冷冻面体不等于整碗面成品；主食类与菜肴也不能不分口径地贴标签。",
      "refs": [
        "udon"
      ],
      "aliases": [
        "乌龙面",
        "udon"
      ],
      "risk": {
        "level": "medium",
        "target": "冷冻面体、汤底与浇头分别看",
        "reason": "现成面体确有商品例证，但它首先是主食原料；我会标中风险组件，不把买面煮面等同整碗料理包。"
      }
    },
    {
      "id": "soba",
      "name": "荞麦冷面",
      "ja": "ざるそば",
      "category": "staple",
      "focus": "component",
      "preparedPath": "荞麦面可以采购鲜面、干面或冷冻面，蘸汁也可能成品调配。",
      "onsitePath": "门店煮面、冷却、处理配菜和配蘸汁。",
      "ask": "面体是店内打制吗？蘸汁是自熬还是成品调配？",
      "trap": "“现煮”和“手打”是不同描述；购买面条不能自动等同整餐预制。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "面体和成品蘸汁",
        "reason": "采购面体与蘸汁能减少备料，但煮面、冷却和组装仍可现场做；成品组件应记录，整餐预制判断应更谨慎。"
      }
    },
    {
      "id": "fried-rice",
      "name": "日式炒饭",
      "ja": "チャーハン",
      "category": "staple",
      "focus": "onsite",
      "preparedPath": "有冷冻炒饭商品，也可用店内米饭和配料按份炒。",
      "onsitePath": "门店备米饭、处理配料，按份炒制。",
      "ask": "是白饭加配料现炒，还是已有配料的冷冻饭复炒？",
      "trap": "提前备饭、使用隔夜冷藏饭，与采购工业成品炒饭不是同一件事。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "是否直接使用已配料的冷冻炒饭",
        "reason": "冷冻成品可复炒，但白饭配菜按份炒也直接；现场有炒锅仍不足以区分两者，因此列中风险核对饭料。"
      }
    },
    {
      "id": "omurice",
      "name": "蛋包饭",
      "ja": "オムライス",
      "category": "staple",
      "focus": "component",
      "preparedPath": "炒饭、蛋皮和酱都可能分别为商品，也可能购买整品。",
      "onsitePath": "店内炒饭、煎蛋包裹并配酱。",
      "ask": "饭、蛋皮和酱分别在哪制作？",
      "trap": "现场浇酱或划开蛋皮，不能反推内馅和蛋皮的来源。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "炒饭内馅、蛋皮与酱",
        "reason": "内馅和蛋皮都有可外购的加工路径，现场浇酱无法排除；但现炒现煎也合理，应拆开查而不一概判整品。"
      }
    },
    {
      "id": "miso-soup",
      "name": "味噌汤",
      "ja": "味噌汁",
      "category": "soup",
      "focus": "component",
      "preparedPath": "可用味噌、出汁粉/浓缩汁及配料，也有即食汤包。",
      "onsitePath": "门店熬出汁、配味噌与豆腐海带等原料。",
      "ask": "出汁是熬制还是调配？汤是整包即食还是门店组合？",
      "trap": "调味料是工业品不等于整碗汤为预制菜。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "整份即食汤包与出汁调味料的区别",
        "reason": "浓缩出汁和味噌是调味基础，不能算整汤成品；只有整包汤料复原才更接近成品路径，故保留中风险。"
      }
    },
    {
      "id": "dobin",
      "name": "土瓶蒸",
      "ja": "土瓶蒸し",
      "category": "soup",
      "focus": "onsite",
      "preparedPath": "汤底和海鲜配料可预处理；也可能采购组合料。",
      "onsitePath": "门店备料配汤，在器皿中加热出餐。",
      "ask": "汤底和配料分别怎么准备？是按份装料加热吗？",
      "trap": "器皿精致、现开盖和蒸汽只能说明上桌状态。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "汤底与按份组合料",
        "reason": "汤底、海鲜料可预处理并按份组合，器皿加热不代表从头自制；同时店内备料也可实现，需要看具体组件。"
      }
    },
    {
      "id": "sukiyaki",
      "name": "寿喜锅",
      "ja": "すき焼き",
      "category": "soup",
      "focus": "onsite",
      "preparedPath": "可采购切片肉、豆腐、丸类和寿喜烧汁。",
      "onsitePath": "门店或桌边处理肉菜，加调味汁煮制。",
      "ask": "肉和菜是什么处理规格？锅汁是店内调还是成品？",
      "trap": "使用切片肉和瓶装汁，不能直接把整锅归为成品复热。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "low",
        "target": "整锅；丸类、汁料单独记录",
        "reason": "核心肉菜熟制可发生在门店或桌边；切片肉与调味汁是基础原料和配料，不能直接判整锅是预制成品。"
      }
    },
    {
      "id": "shabu",
      "name": "日式涮锅",
      "ja": "しゃぶしゃぶ",
      "category": "soup",
      "focus": "onsite",
      "preparedPath": "切片肉、加工鱼丸、汤底和蘸料可以分别采购。",
      "onsitePath": "门店配汤、处理蔬菜，食客或门店涮煮。",
      "ask": "哪些是原料、哪些是调味或成型食品？汤底怎么做？",
      "trap": "把锅里所有食物笼统称为预制菜，会掩盖各组件的实际状态。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "low",
        "target": "整锅；成型丸类和汤底另判",
        "reason": "主要肉菜在桌边涮熟，与整锅成品复热差别明显；原料冷冻、切片或外购蘸料不构成整锅高风险理由。"
      }
    },
    {
      "id": "matcha-icecream",
      "name": "抹茶冰淇淋",
      "ja": "抹茶アイス",
      "category": "dessert",
      "focus": "whole",
      "preparedPath": "可采购桶装或独立份成品，门店负责挖球和装饰。",
      "onsitePath": "门店调制冰淇淋基底、冷冻搅拌，再出餐。",
      "ask": "冰淇淋是店内制作还是外购？能说明品牌或制作方式吗？",
      "trap": "外购甜品是成品供货事实，不应自动套入“需加热菜肴”的监管口径。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "冰淇淋成品；属于外购甜品口径",
        "reason": "调基底、搅拌和冷冻需要专门设备，外购桶装再挖球能替代整段生产；我会优先按成品甜点看待。"
      }
    },
    {
      "id": "daifuku",
      "name": "大福 / 雪媚娘",
      "ja": "大福",
      "category": "dessert",
      "focus": "whole",
      "preparedPath": "可采购已包馅、成型、冷藏或冷冻的甜品。",
      "onsitePath": "店内制皮、包馅、冷却并保存。",
      "ask": "是整只外购，还是店内制皮包馅？",
      "trap": "切开加水果、奶油或盘饰不等于本体自制。",
      "refs": [],
      "aliases": [
        "麻薯",
        "mochi"
      ],
      "risk": {
        "level": "high",
        "target": "整只甜品本体",
        "reason": "制皮、包馅和定型均可在供货前完成，店内解冻加盘饰即可；点单后装饰不能证明本体自制。"
      }
    },
    {
      "id": "pudding",
      "name": "日式布丁",
      "ja": "プリン",
      "category": "dessert",
      "focus": "whole",
      "preparedPath": "可采购杯装或脱模成品，也可用配方/预拌基底自制。",
      "onsitePath": "店内调液、加热凝固和冷藏。",
      "ask": "是店内调液制作，还是成品脱模装盘？",
      "trap": "冷藏定型本来需要时间，不能把提前做都叫工业预制。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "已凝固的杯装或脱模甜品",
        "reason": "调液、凝固和冷藏工序可整体外移，成品脱模摆盘即可；综合日料店里我会优先核对是否外购。"
      }
    },
    {
      "id": "dorayaki",
      "name": "铜锣烧",
      "ja": "どら焼き",
      "category": "dessert",
      "focus": "whole",
      "preparedPath": "饼皮、豆沙馅或整只成品均有外购路径。",
      "onsitePath": "店内煎饼皮，制作或采购豆沙后夹馅。",
      "ask": "饼皮、馅和整只分别是谁做的？",
      "trap": "单个组件自制与整只自制不是同一结论。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "饼皮与整只成品",
        "reason": "煎饼皮、备馅与夹制均可被整只成品替代，门店拆袋装盘就能出餐；加冰淇淋也不能证明饼皮自制。"
      }
    },
    {
      "id": "warabi",
      "name": "蕨饼",
      "ja": "わらび餅",
      "category": "dessert",
      "focus": "whole",
      "preparedPath": "可采购已凝固、切块的甜品，再撒粉和配糖浆。",
      "onsitePath": "店内调浆加热、凝固、切块与配料。",
      "ask": "本体是店内煮制还是成品切块？",
      "trap": "撒黄豆粉或加糖浆是出餐环节，不说明本体制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "已凝固切块的蕨饼",
        "reason": "调浆、加热和凝固能在外部集中完成，店内切块撒粉配糖浆即可；我会重点查本体而不是最后的配料。"
      }
    },
    {
      "id": "gyoza",
      "name": "日式煎饺",
      "ja": "焼き餃子",
      "category": "fried",
      "focus": "half",
      "preparedPath": "厂商有成型饺子商品，并列出煎制等使用方式；不同商品的生熟状态不同。",
      "onsitePath": "店内制皮或购皮、拌馅包制，再煎熟。",
      "ask": "饺子是店内包的还是成型商品？采购时是否已经熟制？",
      "trap": "不能只凭“现煎”判断是否店内拌馅包制，也不能把所有成型饺子当全熟品。",
      "refs": [
        "gyoza"
      ],
      "aliases": [
        "饺子",
        "gyoza"
      ],
      "risk": {
        "level": "high",
        "target": "调馅包制好的饺子；不等于全部全熟",
        "reason": "成型饺子商品能替代拌馅和包制，店内煎熟即可；这是半成品风险，不能由“现煎”排除。"
      }
    },
    {
      "id": "takoyaki",
      "name": "章鱼小丸子",
      "ja": "たこ焼き",
      "category": "fried",
      "focus": "whole",
      "preparedPath": "厂商有冷冻章鱼烧商品，可按具体标签复热或进一步加工。",
      "onsitePath": "店内调面糊、准备章鱼等配料，在模具中烧制。",
      "ask": "是现场从面糊烧制，还是冷冻成品复热/复炸？",
      "trap": "表面酱料、木鱼花和热度不能说明小丸子本体在哪里做。",
      "refs": [
        "takoyaki"
      ],
      "aliases": [
        "章鱼烧",
        "takoyaki"
      ],
      "risk": {
        "level": "high",
        "target": "已烧制成型的章鱼小丸子",
        "reason": "有冷冻成品例证，调面糊和模具烧制可在店外完成；门店复热、复炸再加酱就能出餐，是优先排查对象。"
      }
    }
  ],
  "sources": {
    "gyoza": {
      "title": "Ajinomoto Foodservice · Chicken & Vegetable Gyoza",
      "short": "味之素煎饺商品",
      "url": "https://ajinomotofoodservice.com/product/ajinomoto-chicken-vegetable-gyoza-dumplings-20-12-ct-trays/",
      "market": "北美 / 餐饮用",
      "verified": true,
      "checked": "本次构建已读取厂商原页",
      "supports": "产品页列出产品码6440083、馅料和煎制等烹调方式，证明有可采购的成型饺子商品。不能把这一产品的分类推广为所有煎饺都全熟或都生制。",
      "limit": "不证明具体餐厅采购或使用，不代表市场普及率；商品的具体生熟、储运与加热要求以其标签为准。",
      "sha256": "9710c5d1ea4b3daf4755fd100a1d9a2a87074e5e6c2d3620f0f9f4e35bf06620"
    },
    "takoyaki": {
      "title": "Nissui · 冷冻章鱼烧品牌页",
      "short": "日水章鱼烧",
      "url": "https://www.nissui.co.jp/product/brands/takoyaki.html",
      "market": "日本 / 家庭用",
      "verified": true,
      "checked": "本次构建已读取厂商原页",
      "supports": "公开品牌页介绍冷冻章鱼烧产品，证明已有成型商品供给；它是商品例证，不是餐饮端采购统计。",
      "limit": "不证明具体餐厅采购或使用，不代表市场普及率；商品的具体生熟、储运与加热要求以其标签为准。",
      "sha256": "a1e6ae7041942780d87a3c8bf365ba6f51774ae095cdcebfb84bcb97f3af8c27"
    },
    "seaweed": {
      "title": "Azuma Foods · 芝麻调味海藻",
      "short": "Azuma 海藻商品",
      "url": "https://www.azumafoods.co.jp/product/%E2%89%AAasc%E2%89%AB%E3%81%94%E3%81%BE%E3%82%8F%E3%81%8B%E3%82%81/",
      "market": "日本 / 食品供货",
      "verified": true,
      "checked": "本次构建已读取厂商原页",
      "supports": "商品页为调味海藻类产品，列有用途、原料与商品规格。支持“调味海藻可以按成品采购”的路径，不证明中国门店采购比例。",
      "limit": "不证明具体餐厅采购或使用，不代表市场普及率；商品的具体生熟、储运与加热要求以其标签为准。",
      "sha256": "85774e066e71a6f8f8ef5499d7d85b8f584f20a4f21dbf2fefabeeb58de51d44"
    },
    "octopus": {
      "title": "Azuma Foods · たこわさび",
      "short": "Azuma 芥末章鱼",
      "url": "https://www.azumafoods.co.jp/product/%E3%81%9F%E3%81%93%E3%82%8F%E3%81%95%E3%81%B3/",
      "market": "日本 / 食品供货",
      "verified": true,
      "checked": "本次构建已读取厂商原页",
      "supports": "商品页列有芥末调味状态、章鱼等原料及小钵/前菜/军舰等用途，说明有调味海鲜商品可用于分装或配料。页面名称本身不应替代熟制状态判断。",
      "limit": "不证明具体餐厅采购或使用，不代表市场普及率；商品的具体生熟、储运与加热要求以其标签为准。",
      "sha256": "c2e9d2f558a4c95ded42877d88184e6df380ac305b1499a7323b0389974cbd4c"
    },
    "potato": {
      "title": "Kewpie · 餐饮用土豆沙拉目录",
      "short": "丘比土豆沙拉",
      "url": "https://www.kewpie.co.jp/prouse/products/product_list.php?item=55",
      "market": "日本 / 餐饮用",
      "verified": true,
      "checked": "本次构建已读取厂商原页",
      "supports": "目录列出多款土豆沙拉及具体商品入口，支持土豆沙拉成品供货路径；各商品配方和保存要求需分别核对。",
      "limit": "不证明具体餐厅采购或使用，不代表市场普及率；商品的具体生熟、储运与加热要求以其标签为准。",
      "sha256": "58111d7ba5767a2010c8955e02a700e207ecdb52daeb5504b34e8a9d1bf8148c"
    },
    "egg": {
      "title": "Kewpie · 餐饮用玉子烧目录",
      "short": "丘比玉子烧",
      "url": "https://www.kewpie.co.jp/prouse/products/product_list.php?item=43",
      "market": "日本 / 餐饮用",
      "verified": true,
      "checked": "本次构建已读取厂商原页",
      "supports": "餐饮商品目录列出多种成型玉子烧产品。可用于核实“店内卷煎”与“成品切配”的区别，不能据此推断门店实际采购。",
      "limit": "不证明具体餐厅采购或使用，不代表市场普及率；商品的具体生熟、储运与加热要求以其标签为准。",
      "sha256": "5220250ed74aad6bf4369e3a6eb30e9f0810c287e4cffcd423850ed168e2f885"
    },
    "chicken": {
      "title": "Nichirei · 特撰鶏旨唐揚げ（生IQF）",
      "short": "日冷生制唐扬鸡",
      "url": "https://www.nichireifoods.co.jp/business/business-product/sho_34289/",
      "market": "日本 / 餐饮用",
      "verified": true,
      "checked": "本次构建已读取厂商原页",
      "supports": "具体商品明确标注生IQF、未加热以及炸制方法，支持“调味半成品到店后熟制”的例子。这正说明冷冻商品不应一律当成全熟复热品。",
      "limit": "不证明具体餐厅采购或使用，不代表市场普及率；商品的具体生熟、储运与加热要求以其标签为准。",
      "sha256": "2a8b6aeab6e94560a6ec0ca4eeeb73abbbf956c6e00135282d8770ca7caeeb0b"
    },
    "croquette": {
      "title": "Nichirei · 业务用可乐饼目录",
      "short": "日冷可乐饼",
      "url": "https://www.nichireifoods.co.jp/business/business-product/croquette/",
      "market": "日本 / 餐饮用",
      "verified": true,
      "checked": "本次构建已读取厂商原页",
      "supports": "目录列出多种规格、馅料的可乐饼商品，支持成型供货路径；并未把所有商品统称为全熟成品。",
      "limit": "不证明具体餐厅采购或使用，不代表市场普及率；商品的具体生熟、储运与加热要求以其标签为准。",
      "sha256": "ac16422307045b5d1a5b7a679ff501d87c8c402b3e17653435586e7e6fefb1b1"
    },
    "udon": {
      "title": "TableMark · 冷冻讃岐乌冬特设页",
      "short": "TableMark 乌冬",
      "url": "https://www.tablemark.co.jp/udon/sanuki/index.html",
      "market": "日本 / 面体商品",
      "verified": true,
      "checked": "本次构建已读取厂商原页",
      "supports": "公开页明确介绍冷冻讃岐乌冬，证明工业化面体的供给。面体不是整碗面的汤底、浇头和组装，不能混作同一个层级。",
      "limit": "不证明具体餐厅采购或使用，不代表市场普及率；商品的具体生熟、储运与加热要求以其标签为准。",
      "sha256": "353270ff96bf4f74d51b2ff4c853dc38f597c0a200bb5e838131a888f0880867"
    },
    "kani": {
      "title": "Nissui · 海からサラダ鱼糜制品",
      "short": "日水鱼糜配料",
      "url": "https://www.nissui.co.jp/product/brands/umikarasalad.html",
      "market": "日本 / 加工配料",
      "verified": true,
      "checked": "本次构建已读取厂商原页",
      "supports": "品牌页介绍鱼糜类沙拉/配料商品。支持蟹柳卷需单独研究加工配料的思路；不表示所有蟹肉制品或寿司使用同一商品。",
      "limit": "不证明具体餐厅采购或使用，不代表市场普及率；商品的具体生熟、储运与加热要求以其标签为准。",
      "sha256": "6ac58e8c4114fb404b55be597998ab643b95c443fd9bf5794dda4d26df834d7d"
    },
    "eel": {
      "verified": true,
      "checked": "本次构建已读取厂商原页",
      "limit": "只证明对应商品或制作供货路径存在，不证明某家餐厅使用，也不代表中国门店普及率或法规分类。",
      "title": "川口水产 · 蒲烧加工流程",
      "short": "川口水产蒲烧流程",
      "url": "https://unagiya.com/cp/processing.html",
      "market": "日本 / 制造与供货",
      "supports": "原页展示蒲烧加工流程，并说明烧制后冷冻、真空包装、冷冻保管后向客户供货。支持“熟制鳗鱼到店再处理”的路径；并非任何店铺的采购记录。",
      "sha256": "92fae472c3b68f3a009eb2eb29fbca8c617fc644e52c0734190dac93db173f29"
    },
    "eel-rice": {
      "verified": true,
      "checked": "本次构建已读取厂商原页",
      "limit": "只证明对应商品或制作供货路径存在，不证明某家餐厅使用，也不代表中国门店普及率或法规分类。",
      "title": "山田水产 · 鳗鱼商品信息",
      "short": "山田水产鳗鱼商品",
      "url": "https://yamadasuisan.com/product/",
      "market": "日本 / 商品供货与零售",
      "supports": "商品页同时列出真空包装蒲烧鳗鱼与冷冻鳗鱼饭，说明“仅熟制鱼料”和“连饭整餐商品”是不同层次。不能据此判断餐厅到底使用哪一种。",
      "sha256": "d7633895e28df973c122bdcb5bbacf4ac52f4364869a271d1e6c98c7a0c4192f"
    }
  },
  "riskLevels": {
    "high": {
      "name": "高风险 · 预制重灾区",
      "short": "高风险",
      "rank": 0,
      "lead": "我会优先怀疑外购成品或主要半成品。主要制作可在店外完成，到店后解冻、复热、煎炸或组合即可出餐。"
    },
    "medium": {
      "name": "中风险 · 重点看组件",
      "short": "中风险",
      "rank": 1,
      "lead": "成品配料、汤底或熟料值得查，但现场制作也很直接；要拆开判断，不能把一瓶酱等同整菜预制。"
    },
    "low": {
      "name": "低风险 · 整菜预制较少疑点",
      "short": "低风险",
      "rank": 2,
      "lead": "按整菜预制口径，我会先放低优先级：主要价值在切配、现场熟制或涮煮。原料仍可能冷冻、预切或预腌。"
    }
  },
  "hotspots": [
    {
      "name": "成品凉菜",
      "why": "切配和调味在店外完成，解冻分装就能上桌。",
      "dishes": [
        "wakame",
        "tako-wasabi",
        "seasoned-whelk",
        "potato-salad",
        "sesame-tofu",
        "pickles"
      ]
    },
    {
      "name": "熟鳗鱼与厚烧蛋",
      "why": "蒲烧、卷煎等主要技术工序可被成品替代。",
      "dishes": [
        "kabayaki",
        "unadon",
        "unagi-nigiri",
        "tamagoyaki"
      ]
    },
    {
      "name": "裹粉与成型炸物",
      "why": "现炸只完成最后一步；调味、裹粉和成型可能已做完。",
      "dishes": [
        "korokke",
        "ebi-fry",
        "tonkatsu",
        "karaage",
        "ika-rings",
        "oyster-fry",
        "cheese-stick",
        "katsu-curry"
      ]
    },
    {
      "name": "热小食与成型肉丸",
      "why": "成型商品能替代拌馅、包制或模具烧制。",
      "dishes": [
        "takoyaki",
        "gyoza",
        "tsukune"
      ]
    },
    {
      "name": "外购甜品",
      "why": "制皮、凝固、冷冻等生产工序整体外移，店内装盘。",
      "dishes": [
        "matcha-icecream",
        "daifuku",
        "pudding",
        "dorayaki",
        "warabi"
      ]
    }
  ]
};
