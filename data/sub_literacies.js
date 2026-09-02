/**
 * 子素养体系 —— 合并版（100 项体系 + 行为引用补齐）
 *
 * 数据源：归档 slice_data_full.json「六维子素养」+ behavior 映射引用子素养。
 * 维度键已归一化为工作区六维（体素/心素/灵素/智素/行素/交素）。
 *
 * SUB_LITERACIES[name] = { id, name, dimKey, dimLabel, dim, source: 'system'|'behavior', desc }
 * DIMENSION_SUBS[dimKey] = [name,...]
 * SYNONYM = 行为/切片旧名 → 体系规范名
 * SUB_BEHAVIOR_EXTRA = 行为补齐新增的独立子素养（仅当体系无对应）
 */
const SUB_LITERACIES = {
  "身体感知": {
    "id": "身体感知",
    "name": "身体感知",
    "dimKey": "体素",
    "dimLabel": "身体素养",
    "dim": "身体素养",
    "source": "system",
    "desc": ""
  },
  "感官敏锐": {
    "id": "感官敏锐",
    "name": "感官敏锐",
    "dimKey": "体素",
    "dimLabel": "身体素养",
    "dim": "身体素养",
    "source": "system",
    "desc": ""
  },
  "大动作": {
    "id": "大动作",
    "name": "大动作",
    "dimKey": "体素",
    "dimLabel": "身体素养",
    "dim": "身体素养",
    "source": "system",
    "desc": ""
  },
  "精细动作": {
    "id": "精细动作",
    "name": "精细动作",
    "dimKey": "体素",
    "dimLabel": "身体素养",
    "dim": "身体素养",
    "source": "system",
    "desc": ""
  },
  "力量与耐力": {
    "id": "力量与耐力",
    "name": "力量与耐力",
    "dimKey": "体素",
    "dimLabel": "身体素养",
    "dim": "身体素养",
    "source": "system",
    "desc": ""
  },
  "平衡与协调": {
    "id": "平衡与协调",
    "name": "平衡与协调",
    "dimKey": "体素",
    "dimLabel": "身体素养",
    "dim": "身体素养",
    "source": "system",
    "desc": ""
  },
  "体态意识": {
    "id": "体态意识",
    "name": "体态意识",
    "dimKey": "体素",
    "dimLabel": "身体素养",
    "dim": "身体素养",
    "source": "system",
    "desc": ""
  },
  "安全与应激": {
    "id": "安全与应激",
    "name": "安全与应激",
    "dimKey": "体素",
    "dimLabel": "身体素养",
    "dim": "身体素养",
    "source": "system",
    "desc": ""
  },
  "身体自信": {
    "id": "身体自信",
    "name": "身体自信",
    "dimKey": "体素",
    "dimLabel": "身体素养",
    "dim": "身体素养",
    "source": "system",
    "desc": ""
  },
  "睡眠与节律": {
    "id": "睡眠与节律",
    "name": "睡眠与节律",
    "dimKey": "体素",
    "dimLabel": "身体素养",
    "dim": "身体素养",
    "source": "system",
    "desc": ""
  },
  "营养与自理": {
    "id": "营养与自理",
    "name": "营养与自理",
    "dimKey": "体素",
    "dimLabel": "身体素养",
    "dim": "身体素养",
    "source": "system",
    "desc": ""
  },
  "运动兴趣": {
    "id": "运动兴趣",
    "name": "运动兴趣",
    "dimKey": "体素",
    "dimLabel": "身体素养",
    "dim": "身体素养",
    "source": "system",
    "desc": ""
  },
  "身体边界": {
    "id": "身体边界",
    "name": "身体边界",
    "dimKey": "体素",
    "dimLabel": "身体素养",
    "dim": "身体素养",
    "source": "system",
    "desc": ""
  },
  "身体意象": {
    "id": "身体意象",
    "name": "身体意象",
    "dimKey": "体素",
    "dimLabel": "身体素养",
    "dim": "身体素养",
    "source": "system",
    "desc": ""
  },
  "应激与避险": {
    "id": "应激与避险",
    "name": "应激与避险",
    "dimKey": "体素",
    "dimLabel": "身体素养",
    "dim": "身体素养",
    "source": "system",
    "desc": ""
  },
  "体能挑战": {
    "id": "体能挑战",
    "name": "体能挑战",
    "dimKey": "体素",
    "dimLabel": "身体素养",
    "dim": "身体素养",
    "source": "system",
    "desc": ""
  },
  "身体表达": {
    "id": "身体表达",
    "name": "身体表达",
    "dimKey": "体素",
    "dimLabel": "身体素养",
    "dim": "身体素养",
    "source": "system",
    "desc": ""
  },
  "身体恢复": {
    "id": "身体恢复",
    "name": "身体恢复",
    "dimKey": "体素",
    "dimLabel": "身体素养",
    "dim": "身体素养",
    "source": "system",
    "desc": ""
  },
  "情绪觉知": {
    "id": "情绪觉知",
    "name": "情绪觉知",
    "dimKey": "心素",
    "dimLabel": "情绪素养",
    "dim": "情绪素养",
    "source": "system",
    "desc": ""
  },
  "情绪命名": {
    "id": "情绪命名",
    "name": "情绪命名",
    "dimKey": "心素",
    "dimLabel": "情绪素养",
    "dim": "情绪素养",
    "source": "system",
    "desc": ""
  },
  "情绪表达": {
    "id": "情绪表达",
    "name": "情绪表达",
    "dimKey": "心素",
    "dimLabel": "情绪素养",
    "dim": "情绪素养",
    "source": "system",
    "desc": ""
  },
  "情绪调节": {
    "id": "情绪调节",
    "name": "情绪调节",
    "dimKey": "心素",
    "dimLabel": "情绪素养",
    "dim": "情绪素养",
    "source": "system",
    "desc": ""
  },
  "情绪共情": {
    "id": "情绪共情",
    "name": "情绪共情",
    "dimKey": "心素",
    "dimLabel": "情绪素养",
    "dim": "情绪素养",
    "source": "system",
    "desc": ""
  },
  "情绪恢复力": {
    "id": "情绪恢复力",
    "name": "情绪恢复力",
    "dimKey": "心素",
    "dimLabel": "情绪素养",
    "dim": "情绪素养",
    "source": "system",
    "desc": ""
  },
  "挫折应对": {
    "id": "挫折应对",
    "name": "挫折应对",
    "dimKey": "心素",
    "dimLabel": "情绪素养",
    "dim": "情绪素养",
    "source": "system",
    "desc": ""
  },
  "冲动控制": {
    "id": "冲动控制",
    "name": "冲动控制",
    "dimKey": "心素",
    "dimLabel": "情绪素养",
    "dim": "情绪素养",
    "source": "system",
    "desc": ""
  },
  "延迟满足": {
    "id": "延迟满足",
    "name": "延迟满足",
    "dimKey": "心素",
    "dimLabel": "情绪素养",
    "dim": "情绪素养",
    "source": "system",
    "desc": ""
  },
  "敬畏": {
    "id": "敬畏",
    "name": "敬畏",
    "dimKey": "心素",
    "dimLabel": "情绪素养",
    "dim": "情绪素养",
    "source": "system",
    "desc": ""
  },
  "意义感": {
    "id": "意义感",
    "name": "意义感",
    "dimKey": "心素",
    "dimLabel": "情绪素养",
    "dim": "情绪素养",
    "source": "system",
    "desc": ""
  },
  "情绪安全": {
    "id": "情绪安全",
    "name": "情绪安全",
    "dimKey": "心素",
    "dimLabel": "情绪素养",
    "dim": "情绪素养",
    "source": "system",
    "desc": ""
  },
  "情绪运用": {
    "id": "情绪运用",
    "name": "情绪运用",
    "dimKey": "心素",
    "dimLabel": "情绪素养",
    "dim": "情绪素养",
    "source": "system",
    "desc": ""
  },
  "情绪理解": {
    "id": "情绪理解",
    "name": "情绪理解",
    "dimKey": "心素",
    "dimLabel": "情绪素养",
    "dim": "情绪素养",
    "source": "system",
    "desc": ""
  },
  "家国认同": {
    "id": "家国认同",
    "name": "家国认同",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "system",
    "desc": ""
  },
  "孝亲敬老": {
    "id": "孝亲敬老",
    "name": "孝亲敬老",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "system",
    "desc": ""
  },
  "感恩知义": {
    "id": "感恩知义",
    "name": "感恩知义",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "system",
    "desc": ""
  },
  "节俭": {
    "id": "节俭",
    "name": "节俭",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "system",
    "desc": ""
  },
  "勤勉": {
    "id": "勤勉",
    "name": "勤勉",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "system",
    "desc": ""
  },
  "正直诚实": {
    "id": "正直诚实",
    "name": "正直诚实",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "system",
    "desc": ""
  },
  "道德勇气": {
    "id": "道德勇气",
    "name": "道德勇气",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "system",
    "desc": ""
  },
  "价值坚守": {
    "id": "价值坚守",
    "name": "价值坚守",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "system",
    "desc": ""
  },
  "多元包容": {
    "id": "多元包容",
    "name": "多元包容",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "system",
    "desc": ""
  },
  "敬畏生命": {
    "id": "敬畏生命",
    "name": "敬畏生命",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "system",
    "desc": ""
  },
  "公益利他": {
    "id": "公益利他",
    "name": "公益利他",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "system",
    "desc": ""
  },
  "责任担当": {
    "id": "责任担当",
    "name": "责任担当",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "system",
    "desc": ""
  },
  "诚信友善": {
    "id": "诚信友善",
    "name": "诚信友善",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "system",
    "desc": ""
  },
  "集体归属": {
    "id": "集体归属",
    "name": "集体归属",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "system",
    "desc": ""
  },
  "礼仪规范": {
    "id": "礼仪规范",
    "name": "礼仪规范",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "system",
    "desc": ""
  },
  "志向抱负": {
    "id": "志向抱负",
    "name": "志向抱负",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "system",
    "desc": ""
  },
  "公平公正": {
    "id": "公平公正",
    "name": "公平公正",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "system",
    "desc": ""
  },
  "恭敬礼让": {
    "id": "恭敬礼让",
    "name": "恭敬礼让",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "system",
    "desc": ""
  },
  "忠诚报国": {
    "id": "忠诚报国",
    "name": "忠诚报国",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "system",
    "desc": ""
  },
  "勤劳": {
    "id": "勤劳",
    "name": "勤劳",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "system",
    "desc": ""
  },
  "匠心传承": {
    "id": "匠心传承",
    "name": "匠心传承",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "system",
    "desc": ""
  },
  "生态敬畏": {
    "id": "生态敬畏",
    "name": "生态敬畏",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "system",
    "desc": ""
  },
  "观察感知": {
    "id": "观察感知",
    "name": "观察感知",
    "dimKey": "智素",
    "dimLabel": "认知素养",
    "dim": "认知素养",
    "source": "system",
    "desc": ""
  },
  "好奇追问": {
    "id": "好奇追问",
    "name": "好奇追问",
    "dimKey": "智素",
    "dimLabel": "认知素养",
    "dim": "认知素养",
    "source": "system",
    "desc": ""
  },
  "因果推理": {
    "id": "因果推理",
    "name": "因果推理",
    "dimKey": "智素",
    "dimLabel": "认知素养",
    "dim": "认知素养",
    "source": "system",
    "desc": ""
  },
  "问题解决": {
    "id": "问题解决",
    "name": "问题解决",
    "dimKey": "智素",
    "dimLabel": "认知素养",
    "dim": "认知素养",
    "source": "system",
    "desc": ""
  },
  "知识整合": {
    "id": "知识整合",
    "name": "知识整合",
    "dimKey": "智素",
    "dimLabel": "认知素养",
    "dim": "认知素养",
    "source": "system",
    "desc": ""
  },
  "历史感知": {
    "id": "历史感知",
    "name": "历史感知",
    "dimKey": "智素",
    "dimLabel": "认知素养",
    "dim": "认知素养",
    "source": "system",
    "desc": ""
  },
  "创新创造": {
    "id": "创新创造",
    "name": "创新创造",
    "dimKey": "智素",
    "dimLabel": "认知素养",
    "dim": "认知素养",
    "source": "system",
    "desc": ""
  },
  "求真态度": {
    "id": "求真态度",
    "name": "求真态度",
    "dimKey": "智素",
    "dimLabel": "认知素养",
    "dim": "认知素养",
    "source": "system",
    "desc": ""
  },
  "信息分辨": {
    "id": "信息分辨",
    "name": "信息分辨",
    "dimKey": "智素",
    "dimLabel": "认知素养",
    "dim": "认知素养",
    "source": "system",
    "desc": ""
  },
  "批判思考": {
    "id": "批判思考",
    "name": "批判思考",
    "dimKey": "智素",
    "dimLabel": "认知素养",
    "dim": "认知素养",
    "source": "system",
    "desc": ""
  },
  "想象联想": {
    "id": "想象联想",
    "name": "想象联想",
    "dimKey": "智素",
    "dimLabel": "认知素养",
    "dim": "认知素养",
    "source": "system",
    "desc": ""
  },
  "分类比较": {
    "id": "分类比较",
    "name": "分类比较",
    "dimKey": "智素",
    "dimLabel": "认知素养",
    "dim": "认知素养",
    "source": "system",
    "desc": ""
  },
  "空间想象": {
    "id": "空间想象",
    "name": "空间想象",
    "dimKey": "智素",
    "dimLabel": "认知素养",
    "dim": "认知素养",
    "source": "system",
    "desc": ""
  },
  "数理逻辑": {
    "id": "数理逻辑",
    "name": "数理逻辑",
    "dimKey": "智素",
    "dimLabel": "认知素养",
    "dim": "认知素养",
    "source": "system",
    "desc": ""
  },
  "科学探究": {
    "id": "科学探究",
    "name": "科学探究",
    "dimKey": "智素",
    "dimLabel": "认知素养",
    "dim": "认知素养",
    "source": "system",
    "desc": ""
  },
  "审美感知": {
    "id": "审美感知",
    "name": "审美感知",
    "dimKey": "智素",
    "dimLabel": "认知素养",
    "dim": "认知素养",
    "source": "system",
    "desc": ""
  },
  "文化理解": {
    "id": "文化理解",
    "name": "文化理解",
    "dimKey": "智素",
    "dimLabel": "认知素养",
    "dim": "认知素养",
    "source": "system",
    "desc": ""
  },
  "专注力": {
    "id": "专注力",
    "name": "专注力",
    "dimKey": "智素",
    "dimLabel": "认知素养",
    "dim": "认知素养",
    "source": "system",
    "desc": ""
  },
  "记忆策略": {
    "id": "记忆策略",
    "name": "记忆策略",
    "dimKey": "智素",
    "dimLabel": "认知素养",
    "dim": "认知素养",
    "source": "system",
    "desc": ""
  },
  "行动规划": {
    "id": "行动规划",
    "name": "行动规划",
    "dimKey": "行素",
    "dimLabel": "行动素养",
    "dim": "行动素养",
    "source": "system",
    "desc": ""
  },
  "启动执行": {
    "id": "启动执行",
    "name": "启动执行",
    "dimKey": "行素",
    "dimLabel": "行动素养",
    "dim": "行动素养",
    "source": "system",
    "desc": ""
  },
  "行动韧性": {
    "id": "行动韧性",
    "name": "行动韧性",
    "dimKey": "行素",
    "dimLabel": "行动素养",
    "dim": "行动素养",
    "source": "system",
    "desc": ""
  },
  "动手实践": {
    "id": "动手实践",
    "name": "动手实践",
    "dimKey": "行素",
    "dimLabel": "行动素养",
    "dim": "行动素养",
    "source": "system",
    "desc": ""
  },
  "复盘反思": {
    "id": "复盘反思",
    "name": "复盘反思",
    "dimKey": "行素",
    "dimLabel": "行动素养",
    "dim": "行动素养",
    "source": "system",
    "desc": ""
  },
  "责任感": {
    "id": "责任感",
    "name": "责任感",
    "dimKey": "行素",
    "dimLabel": "行动素养",
    "dim": "行动素养",
    "source": "system",
    "desc": ""
  },
  "时间管理": {
    "id": "时间管理",
    "name": "时间管理",
    "dimKey": "行素",
    "dimLabel": "行动素养",
    "dim": "行动素养",
    "source": "system",
    "desc": ""
  },
  "独立自理": {
    "id": "独立自理",
    "name": "独立自理",
    "dimKey": "行素",
    "dimLabel": "行动素养",
    "dim": "行动素养",
    "source": "system",
    "desc": ""
  },
  "协作担当": {
    "id": "协作担当",
    "name": "协作担当",
    "dimKey": "行素",
    "dimLabel": "行动素养",
    "dim": "行动素养",
    "source": "system",
    "desc": ""
  },
  "质量检测": {
    "id": "质量检测",
    "name": "质量检测",
    "dimKey": "行素",
    "dimLabel": "行动素养",
    "dim": "行动素养",
    "source": "system",
    "desc": ""
  },
  "安全操作": {
    "id": "安全操作",
    "name": "安全操作",
    "dimKey": "行素",
    "dimLabel": "行动素养",
    "dim": "行动素养",
    "source": "system",
    "desc": ""
  },
  "任务拆解": {
    "id": "任务拆解",
    "name": "任务拆解",
    "dimKey": "行素",
    "dimLabel": "行动素养",
    "dim": "行动素养",
    "source": "system",
    "desc": ""
  },
  "坚持完成": {
    "id": "坚持完成",
    "name": "坚持完成",
    "dimKey": "行素",
    "dimLabel": "行动素养",
    "dim": "行动素养",
    "source": "system",
    "desc": ""
  },
  "主动求助": {
    "id": "主动求助",
    "name": "主动求助",
    "dimKey": "行素",
    "dimLabel": "行动素养",
    "dim": "行动素养",
    "source": "system",
    "desc": ""
  },
  "勤俭节约": {
    "id": "勤俭节约",
    "name": "勤俭节约",
    "dimKey": "行素",
    "dimLabel": "行动素养",
    "dim": "行动素养",
    "source": "system",
    "desc": ""
  },
  "自我表达": {
    "id": "自我表达",
    "name": "自我表达",
    "dimKey": "交素",
    "dimLabel": "社交素养",
    "dim": "社交素养",
    "source": "system",
    "desc": ""
  },
  "倾听尊重": {
    "id": "倾听尊重",
    "name": "倾听尊重",
    "dimKey": "交素",
    "dimLabel": "社交素养",
    "dim": "社交素养",
    "source": "system",
    "desc": ""
  },
  "协商与冲突解决": {
    "id": "协商与冲突解决",
    "name": "协商与冲突解决",
    "dimKey": "交素",
    "dimLabel": "社交素养",
    "dim": "社交素养",
    "source": "system",
    "desc": ""
  },
  "共情回应": {
    "id": "共情回应",
    "name": "共情回应",
    "dimKey": "交素",
    "dimLabel": "社交素养",
    "dim": "社交素养",
    "source": "system",
    "desc": ""
  },
  "分享互助": {
    "id": "分享互助",
    "name": "分享互助",
    "dimKey": "交素",
    "dimLabel": "社交素养",
    "dim": "社交素养",
    "source": "system",
    "desc": ""
  },
  "社交发起": {
    "id": "社交发起",
    "name": "社交发起",
    "dimKey": "交素",
    "dimLabel": "社交素养",
    "dim": "社交素养",
    "source": "system",
    "desc": ""
  },
  "边界感": {
    "id": "边界感",
    "name": "边界感",
    "dimKey": "交素",
    "dimLabel": "社交素养",
    "dim": "社交素养",
    "source": "system",
    "desc": ""
  },
  "正义感": {
    "id": "正义感",
    "name": "正义感",
    "dimKey": "交素",
    "dimLabel": "社交素养",
    "dim": "社交素养",
    "source": "system",
    "desc": ""
  },
  "团队合作": {
    "id": "团队合作",
    "name": "团队合作",
    "dimKey": "交素",
    "dimLabel": "社交素养",
    "dim": "社交素养",
    "source": "system",
    "desc": ""
  },
  "文明礼仪": {
    "id": "文明礼仪",
    "name": "文明礼仪",
    "dimKey": "交素",
    "dimLabel": "社交素养",
    "dim": "社交素养",
    "source": "system",
    "desc": ""
  },
  "领导组织": {
    "id": "领导组织",
    "name": "领导组织",
    "dimKey": "交素",
    "dimLabel": "社交素养",
    "dim": "社交素养",
    "source": "system",
    "desc": ""
  },
  "尊重差异": {
    "id": "尊重差异",
    "name": "尊重差异",
    "dimKey": "交素",
    "dimLabel": "社交素养",
    "dim": "社交素养",
    "source": "system",
    "desc": ""
  },
  "规则意识": {
    "id": "规则意识",
    "name": "规则意识",
    "dimKey": "交素",
    "dimLabel": "社交素养",
    "dim": "社交素养",
    "source": "behavior",
    "desc": ""
  },
  "自我效能": {
    "id": "自我效能",
    "name": "自我效能",
    "dimKey": "心素",
    "dimLabel": "情绪素养",
    "dim": "情绪素养",
    "source": "behavior",
    "desc": ""
  },
  "积极情绪培育": {
    "id": "积极情绪培育",
    "name": "积极情绪培育",
    "dimKey": "心素",
    "dimLabel": "情绪素养",
    "dim": "情绪素养",
    "source": "behavior",
    "desc": ""
  },
  "价值取向": {
    "id": "价值取向",
    "name": "价值取向",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "behavior",
    "desc": ""
  },
  "条理整理": {
    "id": "条理整理",
    "name": "条理整理",
    "dimKey": "行素",
    "dimLabel": "行动素养",
    "dim": "行动素养",
    "source": "behavior",
    "desc": ""
  },
  "自我检查": {
    "id": "自我检查",
    "name": "自我检查",
    "dimKey": "智素",
    "dimLabel": "认知素养",
    "dim": "认知素养",
    "source": "behavior",
    "desc": ""
  },
  "利他关怀": {
    "id": "利他关怀",
    "name": "利他关怀",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "behavior",
    "desc": ""
  },
  "公私分明": {
    "id": "公私分明",
    "name": "公私分明",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "behavior",
    "desc": ""
  },
  "谦逊": {
    "id": "谦逊",
    "name": "谦逊",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "behavior",
    "desc": ""
  },
  "理解监控": {
    "id": "理解监控",
    "name": "理解监控",
    "dimKey": "智素",
    "dimLabel": "认知素养",
    "dim": "认知素养",
    "source": "behavior",
    "desc": ""
  },
  "节制": {
    "id": "节制",
    "name": "节制",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "behavior",
    "desc": ""
  },
  "公德心": {
    "id": "公德心",
    "name": "公德心",
    "dimKey": "灵素",
    "dimLabel": "价值素养",
    "dim": "价值素养",
    "source": "behavior",
    "desc": ""
  },
  "语言理解": {
    "id": "语言理解",
    "name": "语言理解",
    "dimKey": "智素",
    "dimLabel": "认知素养",
    "dim": "认知素养",
    "source": "behavior",
    "desc": ""
  },
  "反思": {
    "id": "反思",
    "name": "反思",
    "dimKey": "智素",
    "dimLabel": "认知素养",
    "dim": "认知素养",
    "source": "behavior",
    "desc": ""
  },
  "健康习惯": {
    "id": "健康习惯",
    "name": "健康习惯",
    "dimKey": "体素",
    "dimLabel": "身体素养",
    "dim": "身体素养",
    "source": "behavior",
    "desc": ""
  }
};

const DIMENSION_SUBS = {
  "体素": [
    "身体感知",
    "感官敏锐",
    "大动作",
    "精细动作",
    "力量与耐力",
    "平衡与协调",
    "体态意识",
    "安全与应激",
    "身体自信",
    "睡眠与节律",
    "营养与自理",
    "运动兴趣",
    "身体边界",
    "身体意象",
    "应激与避险",
    "体能挑战",
    "身体表达",
    "身体恢复",
    "健康习惯"
  ],
  "心素": [
    "情绪觉知",
    "情绪命名",
    "情绪表达",
    "情绪调节",
    "情绪共情",
    "情绪恢复力",
    "挫折应对",
    "冲动控制",
    "延迟满足",
    "敬畏",
    "意义感",
    "情绪安全",
    "情绪运用",
    "情绪理解",
    "自我效能",
    "积极情绪培育"
  ],
  "灵素": [
    "家国认同",
    "孝亲敬老",
    "感恩知义",
    "节俭",
    "勤勉",
    "正直诚实",
    "道德勇气",
    "价值坚守",
    "多元包容",
    "敬畏生命",
    "公益利他",
    "责任担当",
    "诚信友善",
    "集体归属",
    "礼仪规范",
    "志向抱负",
    "公平公正",
    "恭敬礼让",
    "忠诚报国",
    "勤劳",
    "匠心传承",
    "生态敬畏",
    "价值取向",
    "利他关怀",
    "公私分明",
    "谦逊",
    "节制",
    "公德心"
  ],
  "智素": [
    "观察感知",
    "好奇追问",
    "因果推理",
    "问题解决",
    "知识整合",
    "历史感知",
    "创新创造",
    "求真态度",
    "信息分辨",
    "批判思考",
    "想象联想",
    "分类比较",
    "空间想象",
    "数理逻辑",
    "科学探究",
    "审美感知",
    "文化理解",
    "专注力",
    "记忆策略",
    "自我检查",
    "理解监控",
    "语言理解",
    "反思"
  ],
  "行素": [
    "行动规划",
    "启动执行",
    "行动韧性",
    "动手实践",
    "复盘反思",
    "责任感",
    "时间管理",
    "独立自理",
    "协作担当",
    "质量检测",
    "安全操作",
    "任务拆解",
    "坚持完成",
    "主动求助",
    "勤俭节约",
    "条理整理"
  ],
  "交素": [
    "自我表达",
    "倾听尊重",
    "协商与冲突解决",
    "共情回应",
    "分享互助",
    "社交发起",
    "边界感",
    "正义感",
    "团队合作",
    "文明礼仪",
    "领导组织",
    "尊重差异",
    "规则意识"
  ]
};

const SYNONYM = {
  "协商解决": "协商与冲突解决",
  "平衡": "平衡与协调",
  "语言表达": "自我表达",
  "审美": "审美感知",
  "想象力": "想象联想",
  "求助": "主动求助",
  "求知态度": "求真态度",
  "独立性": "独立自理",
  "自我觉察": "情绪觉知",
  "规则": "规则意识"
};

const SUB_TOTAL = Object.keys(SUB_LITERACIES).length;

const SUB_BEHAVIOR_EXTRA = [
  "价值取向",
  "健康习惯",
  "公德心",
  "公私分明",
  "利他关怀",
  "反思",
  "条理整理",
  "理解监控",
  "积极情绪培育",
  "自我效能",
  "自我检查",
  "节制",
  "规则意识",
  "语言理解",
  "谦逊"
];

module.exports = { SUB_LITERACIES, DIMENSION_SUBS, SYNONYM, SUB_TOTAL, SUB_BEHAVIOR_EXTRA };
