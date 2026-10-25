"use strict";
// Qualitative editorial judgments with separately scoped manufacturer evidence.
window.MenuRiskData = {
  "version": 1,
  "ui": {
    "storageKey": "chinese-menu.research.v1",
    "aliasLabel": "适用场景",
    "csvName": "中餐预制风险避雷清单.csv",
    "notebookTitle": "中餐点单避雷核实清单",
    "notebookName": "中餐点单核实笔记.md",
    "defaultView": "table",
    "starterIds": [
      "meicai",
      "hongshao",
      "hupi",
      "xiaosurou",
      "yuxiang",
      "ciba"
    ],
    "unit": "项",
    "itemLabel": "项菜单/场景"
  },
  "scope": "普通中餐馆、外卖盖饭、团餐、宴席、火锅及小吃的定性避雷参考；专门现场制作的门店按实际证据另判。",
  "disclaimer": "高、中、低是对菜品及适用场景的定性判断，不是门店使用率、预制概率或食品安全评分。广义外购成品/半成品包含面点和即食凉菜，不能直接当作法规认定。来源证明商品存在，不证明某店采购。",
  "categories": [
    {
      "id": "braise",
      "name": "扣肉、红烧与慢炖",
      "ja": "BRAISED",
      "intro": "优先看长时熟制是否在店外完成。门店自己提前炖煮与外购整包，必须分开。"
    },
    {
      "id": "poultry",
      "name": "鸡鸭、卤味与凤爪",
      "ja": "POULTRY",
      "intro": "区分生腌肉、已卤熟主料与整份带汁成品；装盘和复烤不代表从生料做起。"
    },
    {
      "id": "seafood",
      "name": "鱼虾与海鲜",
      "ja": "SEAFOOD",
      "intro": "鱼片、酸菜、汤底可能分别成品化；活鱼现杀不能证明其他配料自制，冷冻鱼也不自动等于整菜预制。"
    },
    {
      "id": "offal",
      "name": "内脏、汤煲与干锅",
      "ja": "OFFAL & SOUP",
      "intro": "清洗、去腥、预煮或卤制可能由供应商完成；把主料外购与整锅复热分开记录。"
    },
    {
      "id": "fried",
      "name": "小酥肉与成型炸物",
      "ja": "FRIED",
      "intro": "现炸是最后熟制环节，腌制、填馅、成型、裹粉和预炸都可能已在外部完成。"
    },
    {
      "id": "cold",
      "name": "开胃凉菜与调味小菜",
      "ja": "COLD DISHES",
      "intro": "按外购即食成品看待，重点查开袋分装；不把这一消费口径自动等同法规分类。"
    },
    {
      "id": "dim-sum",
      "name": "面点与甜点",
      "ja": "DIM SUM",
      "intro": "把是否门店和面、调馅、包制，与现蒸现炸分开；速冻面米食品另有监管口径。"
    },
    {
      "id": "staple",
      "name": "饭面与浇头",
      "ja": "RICE & NOODLES",
      "intro": "主食、肉料、汤底各有来源。浇头或汤底工业化不意味着整碗饭面是成品。"
    },
    {
      "id": "stir-fry",
      "name": "快炒与较低风险参照",
      "ja": "STIR FRY",
      "intro": "专门保留现场烹调路径直接的对照，不把所有炒菜都当成高风险，也不保证它们完全没有半成品。"
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
  "riskLevels": {
    "high": {
      "name": "高风险 · 预制重灾区",
      "short": "高风险",
      "rank": 0,
      "lead": "我会优先避雷：主要成品、肉料或成型半成品能在店外完成，到店主要复热、煎炸或组合。分清整菜与主料。"
    },
    "medium": {
      "name": "中风险 · 重点看组件",
      "short": "中风险",
      "rank": 1,
      "lead": "预腌肉、汤底或调味组件值得查，但店内制作也直接。重点看场景和具体环节，不把一包调味料当整菜。"
    },
    "low": {
      "name": "低风险 · 整菜预制较少疑点",
      "short": "低风险",
      "rank": 2,
      "lead": "作为点单对照：主要价值在现场切配与熟制。不是完全没有半成品，也不是食品安全更高。"
    }
  },
  "dishes": [
    {
      "id": "meicai",
      "name": "梅菜扣肉",
      "ja": "家常菜馆 / 宴席",
      "category": "braise",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "处理五花肉与梅菜，门店煮炸切配、装碗蒸扣。",
      "ask": "肉是店内从生五花肉制作，还是整碗扣肉复蒸？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "cong",
        "anjoy-mister"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "扣肉和梅菜整份熟品",
        "reason": "煮、炸、切片、调味、蒸扣可整段外移，到店再蒸就能出餐，我会列为第一批避雷项。"
      }
    },
    {
      "id": "taro-kourou",
      "name": "香芋扣肉",
      "ja": "宴席 / 粤菜湘菜",
      "category": "braise",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店处理肉和芋头、切配调味后蒸扣。",
      "ask": "是店内炸肉炸芋头后蒸，还是整碗商品复蒸？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "扣肉与芋头组合熟品",
        "reason": "扣肉前处理费工且适合整碗定型配送，最后一蒸不足以证明店内制作；本次按工序判断。"
      }
    },
    {
      "id": "dou-chi-kourou",
      "name": "豆豉扣肉",
      "ja": "湘菜 / 团餐",
      "category": "braise",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店煮炸肉料、配豆豉后蒸扣。",
      "ask": "到店时是生五花肉还是已蒸扣成品？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "cong-catalog"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "调味和蒸扣好的肉料",
        "reason": "已有厂家同名商品目录，肉处理与扣制可被成品替代；重点看肉是否整碗供货。"
      }
    },
    {
      "id": "hongshao",
      "name": "红烧肉 / 鲍鱼红烧肉",
      "ja": "外卖 / 中快 / 宴席",
      "category": "braise",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店处理五花肉、炒色炖煮并收汁。",
      "ask": "是店里从生肉炖，还是熟制袋装或盒装肉复热？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "hongshao"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "带汁熟制肉；配料版本另看",
        "reason": "厂家鲍鱼红烧肉明确可整盒复热，慢炖和收汁容易在外部完成；店内现炖也能成立。"
      }
    },
    {
      "id": "dongpo",
      "name": "东坡肉",
      "ja": "江浙菜 / 宴席",
      "category": "braise",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "店内将整块肉调味、长时焖煮入味。",
      "ask": "整块肉在哪里焖熟？有没有独立包装？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "整块带汁熟肉",
        "reason": "核心长时焖煮可集中完成，出餐只需蒸热和浇汁，具备成品替代主要制作的特征。"
      }
    },
    {
      "id": "shizitou",
      "name": "红烧狮子头",
      "ja": "淮扬菜 / 家常 / 团餐",
      "category": "braise",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店处理肉馅、调味成型，再烧制。",
      "ask": "丸子在哪里剁肉调馅成型？实际是猪肉还是鸡肉等配方？",
      "trap": "厂家例证含鸡肉版本，不能当作所有狮子头都为猪肉或全熟。",
      "refs": [
        "feng"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "肉丸调馅成型；汤汁另判",
        "reason": "肉馅配方、搅打、成丸可被商品替代，现场红烧只完成后段；已有鸡肉狮子头同类例证。"
      }
    },
    {
      "id": "sixi",
      "name": "四喜丸子",
      "ja": "宴席 / 团餐",
      "category": "braise",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店拌馅、成丸、炸定型再烧制。",
      "ask": "丸子是店内调馅做的，还是成型商品？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "sixi",
        "anjoy"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "成型肉丸",
        "reason": "有2.5kg餐饮商品，备馅成型能整段外移；不能因门店再蒸再烧就判断全程自制。"
      }
    },
    {
      "id": "niunan",
      "name": "土豆牛腩 / 番茄牛腩",
      "ja": "盖饭 / 团餐 / 家常",
      "category": "braise",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店处理牛腩与蔬菜、长时炖煮。",
      "ask": "牛腩是门店炖的，还是熟制牛腩包后加菜？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "炖熟牛腩浇头；蔬菜另看",
        "reason": "牛腩长时炖煮适合集中制成带汁熟料，后加土豆或番茄不能反推肉从生料现做。"
      }
    },
    {
      "id": "zhuti",
      "name": "红烧猪蹄 / 卤猪蹄",
      "ja": "卤味 / 夜宵 / 团餐",
      "category": "braise",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店处理猪蹄、焯水并卤烧。",
      "ask": "猪蹄在哪去腥和卤熟？到店时是否全熟？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "熟制猪蹄",
        "reason": "去毛、去腥、焯煮和卤炖耗工，熟料能替代这些步骤；最后现烤或浇汁只是后段加工。"
      }
    },
    {
      "id": "paigu",
      "name": "糖醋排骨",
      "ja": "家常菜 / 团餐",
      "category": "braise",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店处理排骨，煮炸后调汁收味。",
      "ask": "排骨到店前是否已煮熟或炸过？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "排骨预熟和酱；区分现炖现炸",
        "reason": "排骨可提前熟制或外购，但店内批量焯炖也正常；糖醋汁不能单独证明整份成品。"
      }
    },
    {
      "id": "huangmen",
      "name": "黄焖鸡",
      "ja": "外卖档口 / 盖饭",
      "category": "braise",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店切鸡肉、煸炒调味后焖制。",
      "ask": "鸡块是在店里从生肉焖，还是熟制包下锅？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "熟制鸡块与焖汁；米饭另判",
        "reason": "外卖档口可把长时焖制移到熟料包，出餐加配菜回锅；这里按该场景优先列高，不覆盖所有现焖店。"
      }
    },
    {
      "id": "zhengrou",
      "name": "粉蒸肉 / 粉蒸排骨",
      "ja": "川湘菜 / 蒸菜",
      "category": "braise",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店切肉调味、拌米粉后蒸熟。",
      "ask": "肉和米粉在哪里腌拌？是否整份包装到店？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "腌肉、蒸粉与成份组合",
        "reason": "预腌配粉和成份商品能省工，但店内腌配上蒸笼也直接；现蒸不足以确认前处理来源。"
      }
    },
    {
      "id": "gongbao",
      "name": "宫保鸡丁",
      "ja": "中快 / 川菜",
      "category": "poultry",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "店内切鸡丁、腌制后配椒果调汁炒制。",
      "ask": "鸡丁是生腌下锅还是熟制菜包？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "预腌鸡丁或整袋熟菜",
        "reason": "鸡丁可以预腌，也可以整份熟制，但从生鸡丁现炒同样直接；本次无直接商品例证，不把菜名本身判最高。"
      }
    },
    {
      "id": "curry-chicken",
      "name": "咖喱鸡",
      "ja": "外卖 / 中快",
      "category": "poultry",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店以鸡肉蔬菜与咖喱基底煮制。",
      "ask": "是咖喱块加生鸡肉炖，还是带鸡肉整包熟料？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "curry"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "带鸡肉熟制咖喱；不是仅咖喱块",
        "reason": "有整袋水浴复热的鸡肉咖喱商品；若只是购买咖喱块自己煮，是不同路径。"
      }
    },
    {
      "id": "dapanji",
      "name": "大盘鸡",
      "ja": "新疆菜 / 面馆",
      "category": "poultry",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店切鸡肉，炒香调味并加土豆焖制。",
      "ask": "鸡肉是不是店里从生料炒焖？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "预熟鸡块与酱汁",
        "reason": "大份带汁鸡料便于集中焖熟，但生鸡现炒现焖也合理；本次保留中风险，不用出餐快直接判定。"
      }
    },
    {
      "id": "jiangban-ya",
      "name": "酱板鸭",
      "ja": "湘菜 / 卤味",
      "category": "poultry",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店处理整鸭、腌卤烤制再斩件。",
      "ask": "整鸭在哪腌制卤烤？是店里制作还是成品供货？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "整只熟制鸭",
        "reason": "腌、酱、卤烤与风味定型可集中完成，门店斩件即可；我会优先核对外购熟品。"
      }
    },
    {
      "id": "yanshuiya",
      "name": "盐水鸭",
      "ja": "南京菜 / 卤味",
      "category": "poultry",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店腌鸭、卤煮并冷却斩件。",
      "ask": "鸭是在本店卤，还是熟鸭到店斩件？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "已卤熟鸭；注意门店自卤",
        "reason": "熟制鸭便于配送斩件，但专门卤味店自己批量卤制也合理；需核对卤制地点。"
      }
    },
    {
      "id": "yanjuji",
      "name": "盐焗鸡",
      "ja": "客家菜 / 熟食",
      "category": "poultry",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "店内处理鸡、调味焗熟后拆切。",
      "ask": "鸡到店时是生鸡还是已经盐焗熟的？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "整只熟鸡或鸡块",
        "reason": "整鸡熟制可外移，门店也可用盐焗粉从生鸡制作；工业调味粉不等于整鸡成品。"
      }
    },
    {
      "id": "shousiji",
      "name": "手撕鸡 / 椒麻鸡",
      "ja": "凉菜 / 川湘菜",
      "category": "poultry",
      "focus": "component",
      "preparedPath": "分开查主要配料、汤底与整道菜的来源，现场组合不代表所有组件自制。",
      "onsitePath": "门店煮鸡、放凉拆丝并拌味。",
      "ask": "鸡是在这里煮熟的吗？椒麻汁和肉分别怎么做？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "熟鸡肉和椒麻汁",
        "reason": "手撕可发生在门店，但不能证明鸡也在店内煮；应重点查熟肉来源，不凭手撕动作下结论。"
      }
    },
    {
      "id": "hupi",
      "name": "虎皮凤爪 / 耙鸡爪",
      "ja": "茶楼 / 火锅 / 宴席",
      "category": "poultry",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店处理鸡爪、炸泡起皮后卤煮。",
      "ask": "鸡爪是这里炸卤的，还是带汁熟品复热？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "fengzhua",
        "anjoy-mister"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "已炸卤软烂的鸡爪",
        "reason": "有明确水浴复热商品；起虎皮、卤软等主要工序可外移，复蒸加酱仍可能只是出餐。"
      }
    },
    {
      "id": "paofeng",
      "name": "泡椒凤爪 / 柠檬凤爪",
      "ja": "凉菜 / 夜宵",
      "category": "poultry",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店处理鸡爪、煮熟去骨并浸味。",
      "ask": "鸡爪是店里煮泡去骨，还是调味成品？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "煮熟去骨或调味后的爪料",
        "reason": "去骨、熟制和浸味能集中完成，冷盘只需分装；我会优先查是否整袋成品。"
      }
    },
    {
      "id": "aoerliang",
      "name": "奥尔良烤翅",
      "ja": "夜宵 / 烧烤 / 自助",
      "category": "poultry",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "店内清理鸡翅、腌制后烤熟。",
      "ask": "鸡翅是在店里腌，还是调理鸡翅商品？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "feng"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "预腌鸡翅；不一定全熟",
        "reason": "已有调理烤翅系列，腌制可在店外完成，现烤只能说明最后加热；不等于全熟料理包。"
      }
    },
    {
      "id": "suancai",
      "name": "酸菜鱼",
      "ja": "外卖 / 快餐 / 鱼馆",
      "category": "seafood",
      "focus": "component",
      "preparedPath": "分开查主要配料、汤底与整道菜的来源，现场组合不代表所有组件自制。",
      "onsitePath": "店内片鱼腌制、炒酸菜调汤，再下鱼煮制。",
      "ask": "鱼是店内整鱼现片，还是腌好鱼片？汤底是什么？",
      "trap": "切片腌鱼、酸菜、汤底分开查。活鱼现片也不能证明汤底自熬；冷冻原鱼不等于熟菜。",
      "refs": [
        "anjoy-mister"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "预腌鱼片、酸菜与汤包；不等于整锅熟品",
        "reason": "安井目录有酸菜鱼及免浆鱼片等商品，多组件标准化能替代切鱼腌鱼和调汤；重点查鱼片与汤料，不把整锅一概当熟品。"
      }
    },
    {
      "id": "shuizhuyu",
      "name": "水煮鱼",
      "ja": "川菜 / 外卖",
      "category": "seafood",
      "focus": "component",
      "preparedPath": "分开查主要配料、汤底与整道菜的来源，现场组合不代表所有组件自制。",
      "onsitePath": "门店片鱼腌制、炒底调汤并煮鱼。",
      "ask": "是整鱼现场片，还是预腌鱼片配底料？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "预处理鱼片和底料",
        "reason": "鱼片与底料可外购，但从整鱼现片现煮也直接；麻辣重口和最后泼油不能说明前处理。"
      }
    },
    {
      "id": "kaoyu",
      "name": "炭烤鱼 / 烤鱼",
      "ja": "烤鱼店 / 夜宵",
      "category": "seafood",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店处理鱼，从生鱼烤熟后配汤料。",
      "ask": "鱼入烤炉前是生鱼，还是预烤熟鱼？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "鱼是否预烤全熟；配汤底另看",
        "reason": "生鱼上烤架和熟制烤鱼复热都存在加工路径，最后冒火或浇汤不足以区分；本次按工序列中。"
      }
    },
    {
      "id": "chougui",
      "name": "臭鳜鱼",
      "ja": "徽菜 / 湘菜",
      "category": "seafood",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店处理鱼、控制腌制发酵，再煎烧。",
      "ask": "鱼在哪腌制发酵？到店时是什么状态？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "cong-catalog"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "预腌发酵鱼料；不是默认全熟",
        "reason": "厂家目录有同名鱼料，腌制发酵的关键风味可在店外完成；现场烧制不代表鱼料自腌。"
      }
    },
    {
      "id": "songshu",
      "name": "松鼠桂鱼",
      "ja": "宴席 / 江浙菜",
      "category": "seafood",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店杀鱼去骨改刀、裹粉炸制并浇汁。",
      "ask": "是本店整鱼改刀裹粉，还是成型鱼胚复炸？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "改刀裹粉或预炸鱼胚",
        "reason": "改刀、脱骨和炸形费工，适合半成品替代，但整鱼现杀改刀的店也应单独看；未读取直接商品例证。"
      }
    },
    {
      "id": "duojiao",
      "name": "剁椒鱼头",
      "ja": "湘菜 / 宴席",
      "category": "seafood",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店清理鱼头、调味配剁椒后蒸制。",
      "ask": "鱼头是生料在店里处理配剁椒，还是调味组合商品？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "cong",
        "cong-catalog"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "鱼头预处理与调味组合",
        "reason": "有厂家同名商品，主料清理和剁椒搭配可标准化外供；现蒸只能确认加热环节。"
      }
    },
    {
      "id": "daiyu",
      "name": "香酥带鱼 / 糖醋带鱼",
      "ja": "团餐 / 家常",
      "category": "seafood",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店切鱼腌制、裹粉炸熟并调味。",
      "ask": "鱼段是否已腌、裹粉或炸过？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "anjoy-mister"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "腌制裹粉或预炸鱼段",
        "reason": "安井有香酥带鱼商品，鱼段可按规格处理供货；店里再炸或浇汁不能证明鱼段自腌裹，具体加工深度需看标签。"
      }
    },
    {
      "id": "longxia",
      "name": "麻辣 / 蒜蓉小龙虾",
      "ja": "夜宵 / 外卖 / 自助",
      "category": "seafood",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店处理活虾，炒料并烧制入味。",
      "ask": "是活虾现场炒，还是熟制虾或虾尾包复热？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "熟制带汁虾；活虾另看",
        "reason": "清洗、去腥、熟制和调味可整份集中完成，门店复热就能出餐；活虾现场炒是另一条路径。"
      }
    },
    {
      "id": "shanbei",
      "name": "蒜蓉粉丝扇贝",
      "ja": "烧烤 / 宴席 / 自助",
      "category": "seafood",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店处理扇贝、泡粉丝调蒜蓉，组装后蒸制。",
      "ask": "扇贝、粉丝、蒜蓉是在店里组装吗？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "anjoy-mister"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "已经组装的带壳扇贝半成品",
        "reason": "安井目录有蒜蓉粉丝扇贝，贝肉处理、配粉丝蒜蓉和摆壳能在供货前完成；最后现蒸不能排除组合半成品。"
      }
    },
    {
      "id": "xiahuan",
      "name": "虾滑",
      "ja": "火锅 / 串串",
      "category": "seafood",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店处理虾肉、剁制调配，再成型煮熟。",
      "ask": "虾滑是在店里剁虾调的，还是袋装解冻后成型？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "shrimp"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "调配好的虾滑；整锅另判",
        "reason": "已有解冻搅拌成型再煮的商品，虾肉处理和调配可外移；现场挤丸也不等于现场剁虾。"
      }
    },
    {
      "id": "xiaren",
      "name": "蒜蓉虾仁 / 滑炒虾仁",
      "ja": "家常 / 团餐",
      "category": "seafood",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店处理虾、上浆或调味后炒熟。",
      "ask": "虾仁是否预上浆或预熟？蒜蓉在哪里做？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "上浆虾仁与蒜蓉酱",
        "reason": "去壳冷冻原虾、上浆调理虾和熟虾不同，不能把所有外购虾仁都当作整菜成品。"
      }
    },
    {
      "id": "bailoushrimp",
      "name": "白灼虾",
      "ja": "粤菜 / 海鲜",
      "category": "seafood",
      "focus": "onsite",
      "preparedPath": "主要烹调可以现场完成；仍需区分原料预处理与整菜熟制。",
      "onsitePath": "门店将生虾按份水煮，配蘸汁。",
      "ask": "虾是生料现场煮，还是熟虾解冻摆盘？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "low",
        "target": "整道菜；冷冻生虾另记",
        "reason": "主要熟制可直接从生虾现场水煮完成，不会只因原料冷冻就列为整菜预制重灾区。"
      }
    },
    {
      "id": "feichang",
      "name": "干锅肥肠 / 爆炒肥肠",
      "ja": "川湘菜 / 干锅",
      "category": "offal",
      "focus": "component",
      "preparedPath": "分开查主要配料、汤底与整道菜的来源，现场组合不代表所有组件自制。",
      "onsitePath": "门店清理生肠、焯卤预处理，再炒成菜。",
      "ask": "肥肠在哪清洗去腥、煮卤？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "feichang",
        "anjoy-mister"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "清洗预煮或卤制好的肥肠",
        "reason": "已有清卤肥肠供货，去腥与长时前处理能在外部完成；现场爆炒不代表从生肠清理。"
      }
    },
    {
      "id": "zhuduji",
      "name": "猪肚鸡",
      "ja": "汤锅 / 外卖 / 宴席",
      "category": "offal",
      "focus": "component",
      "preparedPath": "分开查主要配料、汤底与整道菜的来源，现场组合不代表所有组件自制。",
      "onsitePath": "门店清理猪肚、处理鸡肉，从原料煲汤。",
      "ask": "猪肚在哪洗煮？汤是本店煲还是汤包调配？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "处理好的猪肚、熟鸡与汤底",
        "reason": "猪肚去腥和长时煲汤能被熟料汤包替代，端上炉子滚热也不能说明从头煲；本次无直接整锅SKU。"
      }
    },
    {
      "id": "fotiaoqiang",
      "name": "佛跳墙",
      "ja": "宴席 / 团购套餐",
      "category": "offal",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店处理泡发原料、组合并长时煨炖。",
      "ask": "海参鲍鱼等在哪泡发煨炖？是整盅成品吗？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "按份组合并熟制的汤料",
        "reason": "多种原料泡发、炖制费工，适合集中组合成熟品；小盅加热不体现原料泡发和炖制地点。"
      }
    },
    {
      "id": "niuza",
      "name": "干锅牛杂",
      "ja": "湘菜 / 干锅",
      "category": "offal",
      "focus": "component",
      "preparedPath": "分开查主要配料、汤底与整道菜的来源，现场组合不代表所有组件自制。",
      "onsitePath": "门店处理牛杂、预煮，再配料炒制。",
      "ask": "牛杂在哪里清理、焯煮、卤制？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "cong-catalog"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "清理、预煮和卤制的牛杂",
        "reason": "厂家目录有同名商品，去腥和软化工序容易外移；最后干锅调味不等于内脏从生料做起。"
      }
    },
    {
      "id": "yangza",
      "name": "干锅羊杂",
      "ja": "湘菜 / 干锅",
      "category": "offal",
      "focus": "component",
      "preparedPath": "分开查主要配料、汤底与整道菜的来源，现场组合不代表所有组件自制。",
      "onsitePath": "门店清理羊杂、去膻煮制后配菜炒制。",
      "ask": "羊杂到店前是否已经清洗煮熟？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "cong-catalog"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "预处理羊杂",
        "reason": "厂家已有同名供货目录，前处理和去膻费工，熟料能替代；整锅成品与卤好主料要分开。"
      }
    },
    {
      "id": "chaigu",
      "name": "拆骨肉",
      "ja": "湘菜 / 团餐",
      "category": "offal",
      "focus": "component",
      "preparedPath": "分开查主要配料、汤底与整道菜的来源，现场组合不代表所有组件自制。",
      "onsitePath": "门店煮肉、拆骨后调味炒制。",
      "ask": "肉是在本店煮熟拆骨，还是成品肉料？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "cong-catalog"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "煮熟并拆骨的肉料",
        "reason": "拆骨与预煮耗工，厂家目录已列该主料；门店加辣椒回锅不能证明原肉在店内煮拆。"
      }
    },
    {
      "id": "maoxuewang",
      "name": "毛血旺",
      "ja": "川菜 / 中快",
      "category": "offal",
      "focus": "component",
      "preparedPath": "分开查主要配料、汤底与整道菜的来源，现场组合不代表所有组件自制。",
      "onsitePath": "门店处理配料、炒料调汤并煮制。",
      "ask": "有哪些主料已熟制？汤底怎么做？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "血制品、百叶和底料",
        "reason": "主要是多个加工配料与现场煮制组合，不应因鸭血和底料外购就认定整锅料理包。"
      }
    },
    {
      "id": "qingzhengyu",
      "name": "清蒸整鱼",
      "ja": "粤菜 / 海鲜",
      "category": "seafood",
      "focus": "onsite",
      "preparedPath": "主要烹调可以现场完成；仍需区分原料预处理与整菜熟制。",
      "onsitePath": "门店清理整鱼、加料蒸熟。",
      "ask": "是生鱼现场清蒸，还是熟制鱼复蒸？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "low",
        "target": "整鱼熟制；葱姜汁料另看",
        "reason": "若从未熟整鱼清理后蒸熟，主要制作就在现场；蒸鱼豉油外购不足以判整菜高风险。"
      }
    },
    {
      "id": "xiaosurou",
      "name": "小酥肉",
      "ja": "火锅 / 川菜 / 团餐",
      "category": "fried",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店切肉腌制、调糊裹粉并炸熟。",
      "ask": "是店内腌裹的吗？配料是猪肉、鸡肉还是混合肉？",
      "trap": "同名小酥肉有鸡肉和猪肉版本；菜单菜名不保证肉种。现炸也不代表门店切肉腌裹。",
      "refs": [
        "surou",
        "chicken-surou",
        "anjoy"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "预腌裹粉或预炸肉条",
        "reason": "已有猪肉和鸡肉版本商品，直接下锅炸能省去切肉、腌味、裹粉；我会同时查预制环节和肉种。"
      }
    },
    {
      "id": "sourpork",
      "name": "糖醋里脊",
      "ja": "盖饭 / 团餐 / 家常",
      "category": "fried",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店切肉腌制、裹粉炸熟并调汁。",
      "ask": "肉条是否已腌裹或预炸？实际用什么肉？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "anjoy-mister"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "已腌裹粉或预炸的里脊条",
        "reason": "安井目录有糖醋里脊商品，肉条标准化后再炸裹汁就能出餐；现炒糖醋汁不能证明肉条自制，具体生熟看标签。"
      }
    },
    {
      "id": "guobaorou",
      "name": "锅包肉",
      "ja": "东北菜 / 团餐",
      "category": "fried",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店切肉、挂糊炸制，调汁裹匀。",
      "ask": "肉片是店内切片挂糊，还是预裹粉商品？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "成型裹粉或预炸肉片",
        "reason": "薄切、腌制、裹糊和预炸可整段外移，复炸后挂汁仍有现炸口感；本次为工序推断。"
      }
    },
    {
      "id": "ouhe",
      "name": "炸藕盒",
      "ja": "家常 / 团餐",
      "category": "fried",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店切藕、调馅夹制裹浆后炸熟。",
      "ask": "藕和馅是在店里做并夹好的吗？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "ouhe",
        "anjoy-mister"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "夹馅裹浆成型藕盒",
        "reason": "有800g猪肉藕盒商品，切藕、调馅、填馅可在外部完成，到店直接炸制。"
      }
    },
    {
      "id": "qiehe",
      "name": "炸茄盒",
      "ja": "家常 / 团餐",
      "category": "fried",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店切茄、拌馅夹制裹浆后炸熟。",
      "ask": "茄盒是本店夹馅裹浆吗？馅用什么肉？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "qiehe",
        "anjoy-mister"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "夹馅裹浆成型茄盒",
        "reason": "有商品明确鸡肉馅和炸制方式；切茄夹馅裹浆能被成型商品替代。"
      }
    },
    {
      "id": "jimi",
      "name": "鸡米花",
      "ja": "小吃 / 自助 / 中快",
      "category": "fried",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店切鸡肉、腌裹粉后炸熟。",
      "ask": "鸡肉是在店内腌裹粉，还是商品直接下锅？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "feng",
        "anjoy"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "调味裹粉、可能预炸的鸡肉粒",
        "reason": "两家厂家均有商品，凤祥说明裹粉、浅炸速冻等工艺，最终再炸不能证明现场备料。"
      }
    },
    {
      "id": "jipai",
      "name": "香酥鸡排",
      "ja": "小吃 / 团餐 / 盖饭",
      "category": "fried",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "店内处理鸡胸肉、腌制裹粉后炸熟。",
      "ask": "鸡排在哪里处理裹粉？是原切还是成型配方？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "feng",
        "anjoy"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "预处理裹粉或成型鸡排",
        "reason": "多家厂家供货，分切调味裹粉和部分预炸已可外移；现切条也只是出餐步骤。"
      }
    },
    {
      "id": "jiliu",
      "name": "香酥鸡柳 / 川香鸡柳",
      "ja": "夜宵 / 小吃",
      "category": "fried",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店切鸡肉、调味裹粉后炸熟。",
      "ask": "鸡柳是本店切腌裹，还是冷冻调理品？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "feng"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "调理鸡肉条",
        "reason": "厂家系列列川香鸡柳等商品，切条调味和裹粉可外移，现炸不能替代前处理证据。"
      }
    },
    {
      "id": "zhaxianai",
      "name": "炸鲜奶 / 炸椰奶",
      "ja": "粤菜 / 宴席",
      "category": "fried",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店调浆加热凝固、切块裹衣后炸。",
      "ask": "奶块是店内煮制凝固裹粉，还是成型商品？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "qian-fried"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "凝固切块并裹衣的奶块",
        "reason": "已有炸椰奶同类商品，调浆凝固与裹粉可集中完成；最后现炸不证明奶块现制。"
      }
    },
    {
      "id": "zhaxiaqiu",
      "name": "咸蛋黄虾球 / 荔枝形虾球",
      "ja": "宴席 / 自助",
      "category": "fried",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "店内处理虾肉、调味成型包裹后炸熟。",
      "ask": "虾球是在本店调馅包制，还是成型商品？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "qian-dishes"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "成型包裹虾球",
        "reason": "厂家公开菜肴列表已有咸蛋黄荔枝形虾球，调配成型能在工厂完成，门店只需炸制。"
      }
    },
    {
      "id": "yangcongquan",
      "name": "炸洋葱圈",
      "ja": "小吃 / 自助",
      "category": "fried",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店切洋葱、裹粉后炸熟。",
      "ask": "是原切洋葱现裹粉，还是成型裹粉商品？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "anjoy"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "成型或裹粉洋葱圈",
        "reason": "安井小厨目录有洋葱圈，切分裹衣或成型可外移；需另核对原切还是复合配方。"
      }
    },
    {
      "id": "niangjiao",
      "name": "青椒酿肉",
      "ja": "家常 / 团餐",
      "category": "fried",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店处理青椒、调馅填制并烹熟。",
      "ask": "肉馅在哪里调、青椒在哪里填？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "stuffed-pepper"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "已填馅成型青椒",
        "reason": "已有800g餐饮商品，调馅填椒能在店外完成；门店现炸只能证明后段熟制。"
      }
    },
    {
      "id": "yupi",
      "name": "泡椒鱼皮 / 凉拌鱼皮",
      "ja": "凉菜 / 粤菜",
      "category": "cold",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店处理鱼皮、控温去腥并拌味。",
      "ask": "鱼皮在店里处理调味，还是整袋小菜？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "gaishi-seafood"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "已处理并调味的鱼皮",
        "reason": "盖世目录有泡椒及广式调味鱼皮，鱼皮处理和浸味可外移，冷盘分装即可。"
      }
    },
    {
      "id": "muer",
      "name": "爽口木耳 / 泡椒木耳",
      "ja": "套餐小菜 / 凉菜",
      "category": "cold",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店泡发焯熟、冷却并调味。",
      "ask": "木耳是本店泡发焯拌，还是调味成品？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "gaishi-mushroom"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "已调味的凉拌木耳版本",
        "reason": "厂家有多味爽口木耳商品，泡发焯制和调味可整体替代；只针对该成品小菜场景。"
      }
    },
    {
      "id": "xingbaogu",
      "name": "香辣杏鲍菇 / 调味菌菇",
      "ja": "套餐 / 凉菜",
      "category": "cold",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店处理菌菇、焯煮并调味。",
      "ask": "菌菇是在店内切煮调味，还是成袋商品？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "gaishi-mushroom"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "调味成品菌菇",
        "reason": "厂家有红油、葱油、香辣等杏鲍菇商品，门店可直接分装，味道浓不代表现炒。"
      }
    },
    {
      "id": "kaofu",
      "name": "四喜烤麸 / 香菌烤麸",
      "ja": "江浙菜 / 凉菜",
      "category": "cold",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店处理烤麸与菌菇，烧制并放凉入味。",
      "ask": "烤麸在哪里泡煮烧制？是否整袋供货？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "gaishi-mushroom"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "已烧制入味的烤麸小菜",
        "reason": "已有香菌烤麸同类目录，泡发配料、烧制和入味都能提前集中完成。"
      }
    },
    {
      "id": "luobo",
      "name": "爽口萝卜 / 酱萝卜",
      "ja": "套餐小菜 / 家常",
      "category": "cold",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店切萝卜、腌渍并调味。",
      "ask": "萝卜是在店里腌的吗？有没有成品包装？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "gaishi-veg"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "腌制好的萝卜小菜",
        "reason": "厂家目录有爽口萝卜和什锦泡菜，腌制与调味能整体外移，到店分盘。"
      }
    },
    {
      "id": "cuou",
      "name": "油醋脆藕 / 泡椒藕片",
      "ja": "凉菜 / 套餐",
      "category": "cold",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店切藕焯熟、冷却并拌味。",
      "ask": "藕片是本店切焯拌的，还是调味成品？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "gaishi-veg"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "调味藕片",
        "reason": "已有油醋脆藕同类供货，切配焯煮、调味可外移；不要和生藕现炒混为一类。"
      }
    },
    {
      "id": "doufusi",
      "name": "藤椒豆腐丝 / 调味豆干",
      "ja": "凉菜 / 套餐",
      "category": "cold",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店焯处理豆腐丝，再调汁拌匀。",
      "ask": "是普通豆腐丝在店里拌，还是调味成品？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "gaishi-veg"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "整份调味豆制品小菜",
        "reason": "厂家列藤椒豆腐丝，豆制品熟处理和调味可集中完成，门店只分装。"
      }
    },
    {
      "id": "waipo",
      "name": "湘西外婆菜",
      "ja": "湘菜 / 下饭菜",
      "category": "cold",
      "focus": "component",
      "preparedPath": "分开查主要配料、汤底与整道菜的来源，现场组合不代表所有组件自制。",
      "onsitePath": "门店腌制切配蔬菜，按需配肉炒制。",
      "ask": "外婆菜底料是不是外购？肉和菜分别怎么准备？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "cong"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "腌制切配的外婆菜底料",
        "reason": "聪厨已有同名商品，蔬菜腌制与切配可外移；门店再加肉末炒不代表底料自腌。"
      }
    },
    {
      "id": "xianglayouyu",
      "name": "香辣鱿鱼 / 麻辣蚬子",
      "ja": "凉菜 / 套餐",
      "category": "cold",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "店内清理海鲜、熟制并拌味。",
      "ask": "海鲜在哪里处理熟制调味？是否成袋供应？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "gaishi-seafood"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "已调味海鲜小菜",
        "reason": "厂家目录有同名商品，海鲜处理与调味可在店外完成；分装冷盘是优先核查场景。"
      }
    },
    {
      "id": "huanggua",
      "name": "拍黄瓜",
      "ja": "家常 / 凉菜",
      "category": "cold",
      "focus": "onsite",
      "preparedPath": "主要烹调可以现场完成；仍需区分原料预处理与整菜熟制。",
      "onsitePath": "门店洗净黄瓜、拍切后调拌。",
      "ask": "黄瓜是现场拍切的吗？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "low",
        "target": "整道凉菜；汁料另看",
        "reason": "主要工序是清洗拍切和调拌，门店现场制作直接；买酱油或料汁不足以判整菜高风险。"
      }
    },
    {
      "id": "chunjuan",
      "name": "炸春卷",
      "ja": "宴席 / 粥铺 / 团餐",
      "category": "dim-sum",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店备皮调馅包制，再炸熟。",
      "ask": "春卷是在本店调馅包的，还是成型冻品？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "spring"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "已包馅成型春卷",
        "reason": "有明确直接下锅炸制的商品，调馅和包制可在店外完成；现炸不能说明现包。"
      }
    },
    {
      "id": "nanguabing",
      "name": "南瓜饼",
      "ja": "宴席 / 家常 / 粥铺",
      "category": "dim-sum",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店蒸南瓜、和面成型后炸熟。",
      "ask": "是本店做南瓜泥和面，还是冻饼下锅？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "pumpkin"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "已和面包馅成型的饼",
        "reason": "厂家明确无需解冻直接炸，南瓜泥制作、和面和成型都可省去。"
      }
    },
    {
      "id": "ciba",
      "name": "红糖糍粑 / 爆浆糍粑",
      "ja": "火锅 / 宴席",
      "category": "dim-sum",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店制作糯米坯、成型后炸制配糖。",
      "ask": "糍粑本体在哪里做？是成型冻品吗？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "ciba"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "糍粑本体及馅；红糖汁另看",
        "reason": "已有冷冻成型糍粑，主要制作能在外部完成，撒黄豆粉浇糖汁只是最后步骤。"
      }
    },
    {
      "id": "sesameball",
      "name": "芝麻球 / 麻团",
      "ja": "早餐 / 宴席 / 自助",
      "category": "dim-sum",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店和面、包馅滚芝麻后炸熟。",
      "ask": "麻团是店里和面包馅，还是成型商品？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "qian-fried"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "和面包馅成型的麻团",
        "reason": "厂家油炸点心目录明确成型商品与炸制方式；现炸鼓起不说明门店和面包馅。"
      }
    },
    {
      "id": "digua",
      "name": "香芋地瓜丸",
      "ja": "宴席 / 自助",
      "category": "dim-sum",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店处理薯芋、调馅成型后炸。",
      "ask": "丸子是在店里调馅成型，还是整袋供货？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "qian-fried"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "调馅成型丸子",
        "reason": "已在餐饮点心目录中列出，成型冻品直接炸能替代调馅包制，是我优先避雷的宴席点心。"
      }
    },
    {
      "id": "shaomai",
      "name": "糯米烧麦",
      "ja": "早餐 / 酒楼 / 团餐",
      "category": "dim-sum",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店备糯米肉馅、包制并蒸熟。",
      "ask": "烧麦在哪里炒馅包制？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "qian-rice"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "糯米馅与包制成型烧麦",
        "reason": "厂家米制品列表包含多种烧麦，包制和备馅能外移；现场蒸热不代表现包。"
      }
    },
    {
      "id": "xiaolong",
      "name": "小笼包 / 灌汤包",
      "ja": "早餐 / 套餐 / 团餐",
      "category": "dim-sum",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店备面皮肉馅、包制后蒸熟。",
      "ask": "是本店拌馅现包，还是速冻成型包？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "qian-steam"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "已调馅包制的包子",
        "reason": "蒸煎系列有灌汤猪肉小笼包，成型后到店蒸制即可；非专门现包店我会重点查来源。"
      }
    },
    {
      "id": "naibao",
      "name": "奶黄包",
      "ja": "茶楼 / 宴席 / 自助",
      "category": "dim-sum",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店制馅和面、包制并蒸熟。",
      "ask": "奶黄馅和包子是在本店做的吗？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "qian-buns"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "奶黄馅与包制好的包子",
        "reason": "已有成型商品明确蒸制方式，制作奶黄馅与包制可集中完成；蒸笼出餐不等于门店自制。"
      }
    },
    {
      "id": "shengjian",
      "name": "煎饺 / 蒸饺",
      "ja": "早餐 / 套餐",
      "category": "dim-sum",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店调馅、包饺子后煎蒸熟制。",
      "ask": "饺子是在本店拌馅包，还是速冻商品？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "qian-steam"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "拌馅包好的饺子",
        "reason": "厂家有蒸煎系列，主要包制能被成型商品替代；从生冻饺煎熟仍属于半成品路径。"
      }
    },
    {
      "id": "hongtangmantou",
      "name": "红糖馒头 / 花卷",
      "ja": "宴席 / 早餐 / 团餐",
      "category": "dim-sum",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店和面发酵成型后蒸制。",
      "ask": "本店和面发酵吗？还是成型面点复蒸？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "qian-buns"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "已和面成型的面点",
        "reason": "厂家基础面点目录列红糖馒头和花卷，和面、发酵、成型可外移；现蒸不能说明现做。"
      }
    },
    {
      "id": "luroufan",
      "name": "卤肉饭",
      "ja": "外卖 / 中快",
      "category": "staple",
      "focus": "component",
      "preparedPath": "分开查主要配料、汤底与整道菜的来源，现场组合不代表所有组件自制。",
      "onsitePath": "门店炖卤肉并煮饭后组装。",
      "ask": "卤肉是本店炖，还是熟料包复热？米饭另做吗？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "lurou"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "卤肉浇头；米饭另看",
        "reason": "有水浴复热的台式卤肉商品，长时卤制可外移；现煮米饭不改变肉料的预制风险。"
      }
    },
    {
      "id": "yuxiangfan",
      "name": "鱼香肉丝盖饭",
      "ja": "外卖 / 盖饭",
      "category": "staple",
      "focus": "component",
      "preparedPath": "分开查主要配料、汤底与整道菜的来源，现场组合不代表所有组件自制。",
      "onsitePath": "门店切配腌肉、调汁炒菜并煮饭组装。",
      "ask": "浇头是生肉现炒还是整包熟菜？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "yuxiang"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "鱼香肉丝浇头；整饭另判",
        "reason": "有直接复热的鱼香肉丝商品，盖到现煮饭上就能出餐；这是肉菜风险，不等于米饭也是成品。"
      }
    },
    {
      "id": "nuomiji",
      "name": "荷叶糯米鸡",
      "ja": "茶楼 / 早餐",
      "category": "staple",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店备糯米鸡料、包荷叶后蒸制。",
      "ask": "糯米和鸡料在本店调配包制，还是整只冻品？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "qian-rice"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "包裹成型的整份糯米鸡",
        "reason": "已有商品列蒸制或微波方式，备糯米、馅料和包裹能全部外移。"
      }
    },
    {
      "id": "fantuan",
      "name": "肉松饭团 / 卤肉饭团",
      "ja": "早餐 / 团餐",
      "category": "staple",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店煮饭备馅、现场成团。",
      "ask": "饭团是本店煮饭包制，还是成型商品？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "qian-rice"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "米饭与馅料组合后的饭团",
        "reason": "厂家米制品目录列多种成型饭团与蒸制方式，到店加热或再包海苔也可能是成品。"
      }
    },
    {
      "id": "chaofan",
      "name": "扬州炒饭 / 鸡肉炒饭",
      "ja": "外卖 / 快餐",
      "category": "staple",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店备白饭与配料，按份炒制。",
      "ask": "是白饭加配料现炒，还是冷冻成品复炒？",
      "trap": "提前煮饭或用冷藏米饭是门店备料，不等于工业冷冻炒饭。",
      "refs": [
        "feng-rice"
      ],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "成品炒饭与白饭现炒的区别",
        "reason": "已有微波炒饭同类商品，但白饭加料现炒也直接；锅里翻炒不一定能区分复炒与从头炒。"
      }
    },
    {
      "id": "niuroumian",
      "name": "红烧牛肉面",
      "ja": "面馆 / 外卖",
      "category": "staple",
      "focus": "component",
      "preparedPath": "分开查主要配料、汤底与整道菜的来源，现场组合不代表所有组件自制。",
      "onsitePath": "门店炖牛肉熬汤、按份煮面组装。",
      "ask": "牛肉是本店从生肉炖吗？汤底怎么做？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "熟制牛肉浇头与汤；面条另记",
        "reason": "牛肉长时炖煮可被熟料替代，面条现煮不能证明牛肉或汤自熬；普通档口我会重点查。"
      }
    },
    {
      "id": "suancainoodles",
      "name": "酸菜肉丝面",
      "ja": "面馆 / 外卖",
      "category": "staple",
      "focus": "component",
      "preparedPath": "分开查主要配料、汤底与整道菜的来源，现场组合不代表所有组件自制。",
      "onsitePath": "门店炒酸菜肉丝、调汤并煮面。",
      "ask": "酸菜、肉丝和汤分别怎么做？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "酸菜底料与肉丝浇头",
        "reason": "酸菜可外购，肉丝也可现炒；只看到配料袋不足以判断整碗面复热，应分三项问。"
      }
    },
    {
      "id": "luosifen",
      "name": "螺蛳粉 / 肥肠粉",
      "ja": "粉面店 / 外卖",
      "category": "staple",
      "focus": "component",
      "preparedPath": "分开查主要配料、汤底与整道菜的来源，现场组合不代表所有组件自制。",
      "onsitePath": "门店熬汤备浇头、煮粉并组装。",
      "ask": "汤底是熬的还是汤包？浇头是否熟制供货？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "袋装汤底、笋料和熟浇头",
        "reason": "多组件可标准化供货，但米粉现场煮和自熬汤也存在；重点是汤和熟肉，不把整碗一概判成品。"
      }
    },
    {
      "id": "yuxiang",
      "name": "鱼香肉丝（单点）",
      "ja": "外卖中快重点 / 现炒店另看",
      "category": "stir-fry",
      "focus": "whole",
      "preparedPath": "优先查整份熟制、调味成品或组合成品；门店可能主要解冻、复热或摆盘。",
      "onsitePath": "门店切配腌肉、调鱼香汁并炒熟。",
      "ask": "是本店生肉调汁炒，还是整包肉丝菜复热？",
      "trap": "有整袋熟菜商品，不等于所有鱼香肉丝都外购；专门现炒店需结合工序证据。",
      "refs": [
        "yuxiang"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "外卖中快版本的整份肉菜",
        "reason": "厂商有明确水浴复热版本，我会在外卖盖饭档口优先查整包熟菜；专门现炒店不能据此一概定性。"
      }
    },
    {
      "id": "blackpepper",
      "name": "黑椒肉柳 / 黑椒牛柳",
      "ja": "中快 / 家常",
      "category": "stir-fry",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店按肉种修切腌制、配蔬菜炒熟。",
      "ask": "是原肉现切腌，还是调理肉柳？是什么肉？",
      "trap": "黑椒肉柳商品名不是牛肉证明，牛肉、猪肉等版本须核对配料。",
      "refs": [
        "pepper",
        "anjoy-mister"
      ],
      "aliases": [],
      "risk": {
        "level": "high",
        "target": "调理肉柳；尤其核对肉种",
        "reason": "官网有解冻后炒熟的黑椒肉柳，腌制切条可外移；商品名肉柳不能自动证明是牛肉。"
      }
    },
    {
      "id": "xiaochao",
      "name": "小炒黄牛肉",
      "ja": "湘菜 / 外卖",
      "category": "stir-fry",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店切牛肉、腌制，配辣椒快炒。",
      "ask": "牛肉是本店切腌的吗？到店前是否熟制？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [
        "cong"
      ],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "预切预腌牛肉或料理组合",
        "reason": "聪厨目录有同名商品，但生熟深度未知；门店从生牛肉现炒也直接，保留中风险并查肉料。"
      }
    },
    {
      "id": "huiguo",
      "name": "回锅肉",
      "ja": "川菜 / 团餐",
      "category": "stir-fry",
      "focus": "component",
      "preparedPath": "分开查主要配料、汤底与整道菜的来源，现场组合不代表所有组件自制。",
      "onsitePath": "门店煮肉切片，再回锅配菜炒制。",
      "ask": "白肉是在本店煮的，还是熟肉片到店？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "提前煮熟的肉料",
        "reason": "二次炒制本来就是做法，肉预煮不能直接推出外购；重点问第一次煮肉发生在哪里。"
      }
    },
    {
      "id": "yuxiangqiezi",
      "name": "鱼香茄子 / 肉末茄子",
      "ja": "家常 / 团餐",
      "category": "stir-fry",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店处理茄子、煸肉调味后烧制。",
      "ask": "茄子在哪切炸？肉酱是整包还是店内炒？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "预炸茄子与肉酱",
        "reason": "茄子可提前炸制或外购半成品，也可现场炒炸；不能把提前备料和工厂供货混在一起。"
      }
    },
    {
      "id": "disanxian",
      "name": "地三鲜",
      "ja": "东北菜 / 团餐",
      "category": "stir-fry",
      "focus": "half",
      "preparedPath": "优先查预腌、成型、裹粉或预炸半成品；门店仍可能负责最后熟制。",
      "onsitePath": "门店切土豆茄子、炸制后配椒炒匀。",
      "ask": "土豆茄子是本店切炸，还是预炸商品？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "土豆茄子的预炸前处理",
        "reason": "预炸蔬菜能减少备料，但从生菜现场处理也不复杂；现回锅只说明后段，需核实前段地点。"
      }
    },
    {
      "id": "tomatoegg",
      "name": "番茄炒蛋",
      "ja": "家常 / 中快",
      "category": "stir-fry",
      "focus": "onsite",
      "preparedPath": "主要烹调可以现场完成；仍需区分原料预处理与整菜熟制。",
      "onsitePath": "门店处理番茄、打蛋后炒熟。",
      "ask": "是现打蛋或生蛋液下锅，还是熟菜包？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "low",
        "target": "整道炒菜；蛋液规格另看",
        "reason": "从番茄和蛋现场炒制直接，整包熟菜替代主要工序的必要性相对低；并非保证绝无商品版本。"
      }
    },
    {
      "id": "greens",
      "name": "蒜蓉时蔬 / 清炒青菜",
      "ja": "家常 / 菜馆",
      "category": "stir-fry",
      "focus": "onsite",
      "preparedPath": "主要烹调可以现场完成；仍需区分原料预处理与整菜熟制。",
      "onsitePath": "门店清洗切配蔬菜，加蒜快速炒熟。",
      "ask": "是生菜下锅炒，还是熟菜复热？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "low",
        "target": "整道蔬菜；净菜和蒜蓉另记",
        "reason": "洗切净菜与工业调味料不等于成菜，核心炒熟可现场完成，作为较低风险点单参照。"
      }
    },
    {
      "id": "potatoshred",
      "name": "酸辣土豆丝",
      "ja": "家常 / 中快",
      "category": "stir-fry",
      "focus": "onsite",
      "preparedPath": "主要烹调可以现场完成；仍需区分原料预处理与整菜熟制。",
      "onsitePath": "门店切洗土豆丝、控水后快炒调味。",
      "ask": "是生土豆丝现炒吗？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "low",
        "target": "整道炒菜；预切丝另看",
        "reason": "预切土豆丝仍是原料规格，现场炒熟能完成主要制作；不把切得整齐当成预制证据。"
      }
    },
    {
      "id": "qingjiaoegg",
      "name": "青椒炒鸡蛋",
      "ja": "家常 / 中快",
      "category": "stir-fry",
      "focus": "onsite",
      "preparedPath": "主要烹调可以现场完成；仍需区分原料预处理与整菜熟制。",
      "onsitePath": "门店切椒打蛋，配料炒熟。",
      "ask": "青椒和生蛋是点单后现炒吗？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "low",
        "target": "整道炒菜",
        "reason": "处理青椒和鸡蛋后快炒即可，现场制作直接；调味酱外购不足以判整菜高风险。"
      }
    },
    {
      "id": "mapodoufu",
      "name": "麻婆豆腐",
      "ja": "川菜 / 团餐",
      "category": "stir-fry",
      "focus": "component",
      "preparedPath": "分开查主要配料、汤底与整道菜的来源，现场组合不代表所有组件自制。",
      "onsitePath": "门店处理豆腐、炒肉臊与豆瓣后烧制。",
      "ask": "肉臊酱是本店炒的吗？豆腐是现场烧还是整包复热？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "medium",
        "target": "肉臊酱与豆腐；区别熟制整菜包",
        "reason": "豆腐、豆瓣酱和肉臊可分别采购，但现煮豆腐也直接；不能因工业豆瓣酱就判整道高风险。"
      }
    },
    {
      "id": "baizhuoshucai",
      "name": "白灼生菜 / 白灼菜心",
      "ja": "粤菜 / 家常",
      "category": "stir-fry",
      "focus": "onsite",
      "preparedPath": "主要烹调可以现场完成；仍需区分原料预处理与整菜熟制。",
      "onsitePath": "门店洗菜，按份焯熟配汁。",
      "ask": "是生菜现场焯，还是熟菜复热？",
      "trap": "现蒸、现炸、现炒或出餐速度，只能说明部分工序，不能单独证明是否外购；核对到店生熟状态与制作地点。",
      "refs": [],
      "aliases": [],
      "risk": {
        "level": "low",
        "target": "整道蔬菜；料汁另看",
        "reason": "从生菜现场焯熟即可完成主要烹调，不把瓶装豉油或提前洗切等同整菜成品。"
      }
    }
  ],
  "sources": {
    "cong": {
      "title": "聪厨官网：梅菜扣肉王与湘菜产品",
      "short": "聪厨",
      "url": "https://www.congchu.com/",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "首页列梅菜扣肉王、湘西外婆菜、小炒黄牛肉、剁椒鱼头；菜名存在不代表全熟程度。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "50a95baa980f6cc51e0d21e20118ee3b43cb70332286c45358bd7bd84904e0c9"
    },
    "cong-catalog": {
      "title": "聪厨产品分类：扣肉、水产与内脏",
      "short": "聪厨产品目录",
      "url": "https://www.congchu.com/h-col-368.html",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "列豆豉扣肉、臭鳜鱼、剁椒鱼头、白切猪肚、拆骨肉、干锅牛杂、干锅羊杂。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "67c6cec84f0d62077a7b46ed4b6d1540fce7f7f222091d5339d28930c67e2f09"
    },
    "surou": {
      "title": "千味央厨 / 椒麻味猪肉小酥肉",
      "short": "千味央厨",
      "url": "https://www.qianweiyangchu.com/yzcy/406.html",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "官网产品名明确为猪肉小酥肉，并给出下锅炸制方式。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "9d10a31a82ee2aed779daa3b8d9fbeef3b73c46000a480bad4145ae28a77fbcc"
    },
    "chicken-surou": {
      "title": "千味央厨 / 椒香小酥肉（鸡胸肉版本）",
      "short": "千味央厨",
      "url": "https://www.qianweiyangchu.com/yzcy/408.html",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "同名小酥肉商品正文明确鸡胸肉，给出直接炸制方法；说明菜名不能保证肉种。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "7cd7b3d6b98e85110899e69e5beda74132702fadcfefd890a184d5c5daa2dd3f"
    },
    "yuxiang": {
      "title": "千味央厨 / 鱼香肉丝料理",
      "short": "千味央厨",
      "url": "https://www.qianweiyangchu.com/yzcy/432.html",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "300g袋装，明确水浴加热至热透，应用场景中快、外卖。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "cffd573e7d7c4935b95dd9f8d27a872295ec54c4045e7d1965e671e0773a21b9"
    },
    "lurou": {
      "title": "千味央厨 / 台式卤肉料理",
      "short": "千味央厨",
      "url": "https://www.qianweiyangchu.com/yzcy/431.html",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "300g袋装，明确水浴加热至热透，应用场景中快、外卖。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "f9d5e5f2e0feb6ab50b2eefb2d394e387b95d299ea80427239a30b2c06aa30f3"
    },
    "hongshao": {
      "title": "千味央厨 / 本帮鲍鱼红烧肉",
      "short": "千味央厨",
      "url": "https://www.qianweiyangchu.com/yzcy/427.html",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "明确可明火或蒸锅完全复热；例证是鲍鱼红烧肉版本，不覆盖所有红烧肉。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "3aec4425079975fdaaefd3a2284912621c15dd01374be74b8cb0a34dbd65c48b"
    },
    "fengzhua": {
      "title": "千味央厨 / 卤虎皮鸡爪",
      "short": "千味央厨",
      "url": "https://www.qianweiyangchu.com/yzcy/416.html",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "200g袋装，明确水浴复热，应用含火锅、烧烤、中快、宴席。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "d01902c628f5781182bf687083d6eccfe10b39656d9eb618ac63eb1090b0ea2f"
    },
    "sixi": {
      "title": "千味央厨 / 四喜丸子",
      "short": "千味央厨",
      "url": "https://www.qianweiyangchu.com/yzcy/522.html",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "2.5kg成型丸子商品，列清炖、清蒸、红烧、炒制；不能仅凭目录断言全熟。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "85231b119d323b0dbd46742d955164dfe8dee8d1896353b9ce0749ce005657ce"
    },
    "ouhe": {
      "title": "千味央厨 / 猪肉藕盒",
      "short": "千味央厨",
      "url": "https://www.qianweiyangchu.com/yzcy/397.html",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "800g袋装成型商品，列炸制出餐方式。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "97efd781d963df3ea9b309a89c3f9521edfa9c839c0f9c63d29bdc6172b73a3c"
    },
    "qiehe": {
      "title": "千味央厨 / 香脆茄盒",
      "short": "千味央厨",
      "url": "https://www.qianweiyangchu.com/yzcy/390.html",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "800g袋装成型商品，正文描述鸡肉内馅并列炸制方式。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "1fab73895402daf4931ffd1ddb9af7f614fcc8e61ddf03ea4c2ceb68a40f773b"
    },
    "spring": {
      "title": "千味央厨 / 荠菜肉丁春卷",
      "short": "千味央厨",
      "url": "https://www.qianweiyangchu.com/yzdx/219.html",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "已包馅成型商品，明确无需解冻直接炸制。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "c59a8d3c87d49dcbfda51ac36bf39c2323ca991dad96db702fe79e4424a38a1b"
    },
    "pumpkin": {
      "title": "千味央厨 / 无馅南瓜饼",
      "short": "千味央厨",
      "url": "https://www.qianweiyangchu.com/yzdx/221.html",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "成型南瓜饼，明确无需解冻炸制。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "6914b77a190da07417fa32797b7fae3215e4671416b818fc4f2f369eb8276baa"
    },
    "ciba": {
      "title": "千味央厨 / 红糖爆浆糍粑",
      "short": "千味央厨",
      "url": "https://www.qianweiyangchu.com/yzdx/238.html",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "成型带馅糍粑商品，列炸制方式和火锅、宴席应用。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "5a628dca223aadf92a59e8059ba1846b67097c0124ad0726d4c50c9db258f0fd"
    },
    "feichang": {
      "title": "千味央厨 / 清卤肥肠",
      "short": "千味央厨",
      "url": "https://www.qianweiyangchu.com/yzcy/385.html",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "500g商品，列涮锅或爆炒熟制后食用；外购处理主料不等于整道干锅成品。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "3dc817ae7dff73ebd4da845c8a643781c42ce72ebbd9b9f215a5493decac1115"
    },
    "shrimp": {
      "title": "千味央厨 / 大颗粒虾滑",
      "short": "千味央厨",
      "url": "https://www.qianweiyangchu.com/yzcy/413.html",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "150g商品，明确适度解冻、搅拌、成型并烹饪至成熟；不是整锅成品。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "48c2e2f80d4a181cc366d5dcac92fcb18d16e5cc7820c10c5c39607465050bbe"
    },
    "pepper": {
      "title": "千味央厨 / 黑椒肉柳",
      "short": "千味央厨",
      "url": "https://www.qianweiyangchu.com/yzcy/393.html",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "商品说明解冻沥干后翻炒至熟，支持调理主料路径；不推断为牛肉。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "54f2693179a79c98a6f355d95e1b3716e04650bacc70c2cb2c9f23e38279349f"
    },
    "curry": {
      "title": "千味央厨 / 经典咖喱鸡",
      "short": "千味央厨",
      "url": "https://www.qianweiyangchu.com/yzcy/430.html",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "300g料理，明确水浴复热，应用中快、外卖。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "82fe076fa188d6c053ff0917b52d9cfeaeab9973be52c13e4ad6c8d4e4cab394"
    },
    "stuffed-pepper": {
      "title": "千味央厨 / 青椒酿肉",
      "short": "千味央厨",
      "url": "https://www.qianweiyangchu.com/yzcy/510.html",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "800g成型商品，明确解冻后炸至成熟，适用中式快餐、团餐。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "e4c0317b76d6c139ab19fa10cf8af5d9e5f7561eeac1ecdc8268b846328d7304"
    },
    "qian-fried": {
      "title": "千味央厨油炸点心目录",
      "short": "千味央厨点心目录",
      "url": "https://www.qianweiyangchu.com/yzdx.html",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "官网公开列表包含芝麻球、香芋地瓜丸、炸椰奶、糍粑和春卷，配有炸制方式。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "0619e4083ac5b63290dc35112255878dd0b8139bd04c9e240ee49c0ecf74e5f1",
      "dataUrl": "https://www.qianweiyangchu.com/ajax/list2?id=32&start=1&limit=100"
    },
    "qian-steam": {
      "title": "千味央厨蒸煎系列目录",
      "short": "千味央厨蒸煎目录",
      "url": "https://www.qianweiyangchu.com/zjj.html",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "包含蒸煎饺和上海风味灌汤猪肉小笼包；说明无需解冻后蒸制或煎制。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "a6ecd51b8163cfe44fa34e833def86614d19dd2bdf7c4f883caf85a4236b8d78",
      "dataUrl": "https://www.qianweiyangchu.com/ajax/list2?id=28&start=1&limit=100"
    },
    "qian-rice": {
      "title": "千味央厨米制品目录",
      "short": "千味央厨米制品",
      "url": "https://www.qianweiyangchu.com/mzp.html",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "包含糯米鸡、饭团与糯米烧麦，列蒸制出餐方式。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "b98a205f50443f9e981eee0e3ce2622af437e81452462031b4d20b4be8558387",
      "dataUrl": "https://www.qianweiyangchu.com/ajax/list2?id=27&start=1&limit=100"
    },
    "qian-buns": {
      "title": "千味央厨基础面点目录",
      "short": "千味央厨面点",
      "url": "https://www.qianweiyangchu.com/jcmd.html",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "包含酱肉包、猪肉包、青菜包、奶黄包、红糖馒头和花卷，列蒸制方式。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "2de97a96c6921e3b73ff5f757a2189e25d5fa6f7e3479319ed1f10afc6c604d8",
      "dataUrl": "https://www.qianweiyangchu.com/ajax/list2?id=31&start=1&limit=100"
    },
    "gaishi-veg": {
      "title": "盖世食品健康蔬菜类",
      "short": "盖世食品",
      "url": "https://www.gaishi.cn/jksc/",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "列油醋脆藕、什锦泡菜、爽口萝卜、藤椒豆腐丝等调味小菜。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "75aade885b52347a43562bf7e837af11278f2f3dee353714903f084a951b2893"
    },
    "gaishi-mushroom": {
      "title": "盖世食品营养菌菇类",
      "short": "盖世食品",
      "url": "https://www.gaishi.cn/yyjg/",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "列香菌烤麸、多种口味调味杏鲍菇、爽口木耳等商品。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "041c5d3e672e8440d4520e2c8c646aa8a7d4053f97b8c9d8360d7a4668ef0861"
    },
    "gaishi-seafood": {
      "title": "盖世食品海洋珍味类",
      "short": "盖世食品",
      "url": "https://www.gaishi.cn/hyzw/",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "列泡椒鱼皮、广式调味鱼皮丝、香辣鱿鱼、麻辣蚬子等商品。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "acc90c71b05a84344ece49b0a57ad1d044acfa406d5d7f2c101f88ec35bd8bc7"
    },
    "feng": {
      "title": "凤祥调理鸡肉系列",
      "short": "凤祥食品",
      "url": "https://www.fengxiang.com/index/product/details/id/4/tab/1.html",
      "market": "中国 · 调理鸡肉系列（兼消费端）",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "列鸡米花、黄金鸡排、川香鸡柳、炭烤鸡肉脆骨串、马蹄鸡肉狮子头等；部分明确浅炸速冻。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "a8cd23166b66bddbc00a03b92a624d4efa8146d99ba6015299e19431850701c8"
    },
    "anjoy": {
      "title": "安井小厨官方商品目录",
      "short": "安井食品",
      "url": "https://www.anjoyfood.com/product/pages/item/32",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "公开产品数据列鸡米花、鸡排、洋葱圈、黄金鸡块、酿豆腐等；未据目录断言全部全熟。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "0fe475c55e9d8e79c873b413e1662670ced6e7404112a0b81904df63de44fe7f",
      "dataUrl": "https://www.anjoyfood.com/yq/cms/menuArticleList?menuId=44&pageNum=1&languageType=zh_CN&pageSize=100"
    },
    "anjoy-mister": {
      "title": "安井冻品先生官方商品目录",
      "short": "安井冻品先生",
      "url": "https://www.anjoyfood.com/product/pages/item/32",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "列酸菜鱼、蒜蓉粉丝扇贝、梅菜扣肉、糖醋里脊、香酥带鱼、虎皮凤爪、清卤肥肠和黑椒肉柳等；目录不能单独证明各款具体生熟深度。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "7e2f57c653061d4db405196cd6c24523cd60d5220508ce735b25030770e5666f",
      "dataUrl": "https://www.anjoyfood.com/yq/cms/menuArticleList?menuId=48&pageNum=1&languageType=zh_CN&pageSize=100"
    },
    "qian-dishes": {
      "title": "千味央厨预制菜肴目录",
      "short": "千味央厨菜肴目录",
      "url": "https://www.qianweiyangchu.com/yzcy.html",
      "market": "中国 · 厂家公开商品/餐饮供货目录",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "列咸蛋黄荔枝形虾球、盐酥鸡、青椒酿肉、肉柳等，配有加工方法；未把所有肉柳当牛肉。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "67bd020064acd194986bea077e897092395306244ccd96416c0dc30db7af2f29",
      "dataUrl": "https://www.qianweiyangchu.com/ajax/list2?id=24&start=1&limit=100"
    },
    "feng-rice": {
      "title": "凤祥官网：鸡胸肉蛋白炒饭例证",
      "short": "凤祥食品",
      "url": "https://www.fengxiang.com/",
      "market": "中国 · 消费端同类商品",
      "verified": true,
      "checked": "2026-10-25 读取原页/官网公开产品数据",
      "supports": "官网展示鸡胸肉蛋白炒饭并明确可微波加热；仅支撑同类冷冻炒饭路径，不证明扬州炒饭必定外购。",
      "limit": "证明有此类商品供货，不证明某家店采购或中国餐厅使用率；同名菜的肉种、生熟、配方和工序可不同。",
      "sha256": "848fce5f597381f70c34e1b5137eb59983d7e8ba54d1bc810cebe889bde72d22"
    }
  },
  "hotspots": [
    {
      "name": "扣肉、慢炖肉与丸子",
      "why": "主要制作耗时，可整份复热或采购成型主料。",
      "dishes": [
        "meicai",
        "hongshao",
        "dongpo",
        "sixi",
        "zhuti",
        "shizitou"
      ]
    },
    {
      "name": "外卖熟肉浇头",
      "why": "米饭现煮，也可能搭配水浴复热的整袋肉菜。",
      "dishes": [
        "huangmen",
        "curry-chicken",
        "luroufan",
        "yuxiangfan",
        "niuroumian"
      ]
    },
    {
      "name": "内脏、熟鸡爪与汤煲",
      "why": "清理、去腥、卤软与长时炖煮容易外移。",
      "dishes": [
        "feichang",
        "niuza",
        "hupi",
        "zhuduji",
        "fotiaoqiang"
      ]
    },
    {
      "name": "小酥肉、藕盒与鸡肉炸物",
      "why": "现炸是最后一步，主要备料可能已经完成。",
      "dishes": [
        "xiaosurou",
        "ouhe",
        "qiehe",
        "jimi",
        "jipai",
        "guobaorou"
      ]
    },
    {
      "name": "鱼虾主料与组合海鲜",
      "why": "关注预腌鱼片、熟虾和预组装扇贝，分别判断。",
      "dishes": [
        "suancai",
        "chougui",
        "duojiao",
        "longxia",
        "shanbei",
        "xiahuan"
      ]
    },
    {
      "name": "调味凉菜与成型点心",
      "why": "开袋分装、蒸热或炸熟即可出餐，查制作来源。",
      "dishes": [
        "yupi",
        "muer",
        "luobo",
        "chunjuan",
        "ciba",
        "nanguabing",
        "shaomai"
      ]
    }
  ]
};
