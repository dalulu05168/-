const LANG_KEY="bv_language";
const dictionaries={
  en:{
    "总览大盘":"Dashboard","客户中心":"Customers","人员中心":"Staff","交易记录":"Trades","持仓中心":"Positions","行情中心":"Markets","统计报表":"Reports","系统设置":"Settings","股票份额看板":"Share Allocation",
    "系统正常":"System Online","退出":"Sign out","登录系统":"Sign in","账号":"Account","密码":"Password","安全登录":"Secure login","数据库权限隔离":"Database access isolation","操作记录审计":"Audit trail",
    "客户列表":"Customer List","新增客户":"New Client","全部状态":"All Status","潜在客户":"Prospect","服务中":"In Service","持仓中":"Holding","已结束":"Closed","已归档":"Archived",
    "人员账户管理":"Staff Accounts","新建人员账户":"Create Staff Account","重置密码":"Reset Password","禁用":"Disable","启用":"Enable",
    "交易流水":"Trade Ledger","当前持仓明细":"Current Positions","刷新持仓":"Refresh Positions","多国家行情":"Global Markets","股票列表":"Securities",
    "管理员":"Administrator","一级人员":"Level 1","二级人员":"Level 2","客户姓名":"Client Name","性别":"Gender","男性":"Male","女性":"Female","未填写":"Not set","年龄（可选）":"Age (optional)","地区（可选）":"Region (optional)",
    "客户备注":"Client Notes","编辑客户备注":"Edit Client Notes","新增交易":"Add Trade","记录跟进":"Add Service Note","截图模式":"Screenshot Mode","恢复显示":"Restore","返回":"Back",
    "持仓成本":"Cost Basis","最新行情市值":"Latest Market Value","未实现盈亏":"Unrealized P/L","已实现盈亏":"Realized P/L","综合收益率":"Total Return","最近交易":"Latest Trade",
    "客户持仓与买卖记录":"Client Holdings & Trades","客户资料与服务纪要":"Client Profile & Service Notes","持仓结构 / 收益构成":"Allocation / P&L Mix","持仓收益走势":"Position P/L Trend",
    "买入":"Buy","卖出":"Sell","买进":"Buy","卖出":"Sell","时间":"Time","数量":"Quantity","价格":"Price","手续费":"Fees","备注":"Notes","保存交易":"Save Trade",
    "股票份额":"Share Allocation","剩余份额":"Remaining Shares","已预留份额":"Reserved Shares","总份额":"Total Shares","剩余占比":"Remaining Ratio","距离交易剩余时间":"Time Remaining",
    "时段预留份额":"Reserved Shares by Time","时段参与人数":"Participants by Time","罗马尼亚时间":"Romania Time","最新数据时间":"Latest Data Time","更新时间":"Updated",
    "业务使用情况":"Business Activity","当前账户":"Current Account","角色":"Role","团队人员":"Team Members","客户总数":"Clients","今日交易":"Today Trades","待跟进":"Pending Follow-up","刷新":"Refresh",
    "语言":"Language","交易时段":"Trading Window","份额配置":"Allocation Setup","保存设置":"Save Settings","开盘时间":"Market Open","目标交易时间":"Target Trade Time",
    "跟进中":"Following","搜索姓名 / 编号 / 电话":"Search name / ID / phone","风险级别":"Risk Level","低":"Low","普通":"Normal","高":"High","电话（可选）":"Phone (optional)","邮箱（可选）":"Email (optional)","资金规模（可选）":"Capital (optional)","资金币种":"Currency","客户状态":"Client Status","归属二级人员":"Assigned Level 2","客户备注（由二级人员填写）":"Client Notes","保存客户资料":"Save Client","市场":"Market","交易类型":"Trade Type","股票代码":"Symbol","股票名称":"Security Name","币种":"Currency","交易时间":"Trade Time","沟通渠道":"Channel","下次跟进":"Next Service","跟进内容":"Service Note","保存跟进记录":"Save Service Note","姓名":"Name","上级":"Supervisor","状态":"Status","创建时间":"Created","操作":"Action","查看":"View","客户":"Clients","持仓":"Positions","交易":"Trades","报表":"Reports","设置":"Settings","概览":"Overview","跟进":"Service","趋势":"Trend","成交价":"Price","成交金额":"Value","持仓标的":"Open Securities","当前持仓":"Current Positions","成本基准":"Cost Basis","份额看板":"Allocation Board","修改交易时段":"Edit Trading Window","显示规则":"Display Rule","公司信息":"Company Info","我的客户":"My Clients","持仓客户":"Holding Clients","今日买入":"Buys Today","今日卖出":"Sells Today","累计买进":"Total Buys","累计卖出":"Total Sells","编辑账号":"Edit Account","删除账号":"Delete Account","保存账号修改":"Save Account Changes","新建人员账户":"Create Staff Account","人员账户管理":"Staff Accounts","最高管理员":"Top Administrator","所属一级人员":"Assigned Level 1","创建账户":"Create Account","电话":"Phone","当前状态":"Current Status",
    "罗马尼亚":"Romania","美国":"United States","法国":"France","德国":"Germany","英国":"United Kingdom","意大利":"Italy","西班牙":"Spain","荷兰":"Netherlands","瑞士":"Switzerland","波兰":"Poland","日本":"Japan",
    "首次初始化管理员":"Initial Administrator Setup","管理员 / 一级人员 / 二级人员统一入口":"Unified entry for Administrator / Level 1 / Level 2","系统尚未初始化，请创建第一个管理员账户。":"The system is not initialized. Create the first administrator account.","创建管理员并进入系统":"Create Administrator","客户资料":"Client Profile","总览":"Overview",
    "填写客户偏好、重点信息、服务说明等":"Client preferences, key information and service notes","地区未填写":"Region not set","年龄未填写":"Age not set","暂无交易":"No trades","价格走势":"Price Movement","成本结构":"Cost Structure","累计净投入":"Net Capital Invested","已实现":"Realized","未实现":"Unrealized","持仓浮动盈亏":"Position P/L",
    "管理员拥有最高权限：一级人员直属管理员，二级人员直属一级人员；可修改、重置、禁用与删除人员账号":"Administrator has the highest authority. Level 1 reports to Administrator and Level 2 reports to Level 1. Administrator can edit, reset, disable and delete staff accounts.","查看本人及名下二级人员；权限由数据库 RLS 强制执行":"View your own account and assigned Level 2 staff. Access is enforced by database RLS.","搜索客户 / 股票":"Search client / security","当前股票暂无可用行情":"No quote available for this security","请更换股票或市场":"Choose another security or market","暂无可用行情":"No quote available","行情价":"Market Price","未知":"Unknown","按当前权限范围实时汇总，不使用虚拟业务数据。":"Live aggregation within current permissions. No fabricated business data.","客户数量":"Client Count","中文":"Chinese",
    "账号资料已更新":"Account updated","人员账户已创建":"Staff account created","密码已重置":"Password reset","账户状态已更新":"Account status updated","账号已删除，历史业务记录已保留":"Account deleted; historical business records retained","客户资料已保存":"Client saved","客户备注已更新":"Client notes updated","交易已保存，持仓已自动重算":"Trade saved; positions recalculated","跟进记录已保存":"Service note saved","已恢复内部操作按钮。":"Internal controls restored.","截图模式：仅隐藏内部归属、新增交易、记录跟进。":"Screenshot mode hides only internal owner, add trade and service-note controls.","二级人员团队":"Level 2 Team","团队客户":"Team Clients","团队买卖结构":"Team Order Mix","团队业务摘要":"Team Business Summary","直属当前一级人员":"Direct reports to current Level 1","全部二级人员客户":"All Level 2 clients","持有至少一个标的":"Holding at least one security","罗马尼亚交易日":"Romania trading day","到期服务任务":"Due service tasks","二级人员详情":"Level 2 Details","客户明细":"Client Details","交易记录":"Trade Records","暂无直属二级人员":"No direct Level 2 staff","暂无交易记录":"No trade records","点击卡片查看客户和交易":"Click a card to view clients and trades",
    "更新":"Updated","行情更新":"Market updated","最新数据时间（罗马尼亚）":"Latest data time (Romania)","数据读取失败":"Data load failed",
    "读取失败":"Read failed","正在初始化…":"Initializing…","初始化失败":"Initialization failed","管理员创建成功，请登录":"Administrator created. Please sign in.","正在登录…":"Signing in…","账户未启用或无系统权限":"Account disabled or unauthorized","未知错误":"Unknown error","已切换业务趋势":"Business trend selected","正在刷新数据":"Refreshing data","编辑人员账号":"Edit Staff Account","操作失败":"Operation failed","请输入新密码（至少 8 位）":"Enter a new password (minimum 8 characters)","确认禁用该账户？":"Disable this account?","确认启用该账户？":"Enable this account?","时段记录日期必须与看板日期一致":"Slot date must match board date","时段记录必须位于有效业务时段内":"Slot must be within the valid business window","不能录入未来时段数据":"Future slot data cannot be entered","时段预留份额合计不能超过已预留份额":"Interval reserved shares cannot exceed total reserved shares","新增客户":"New Clients","成本结构":"Cost Structure","累计净投入":"Net Invested","已实现":"Realized","未实现":"Unrealized","持仓浮动盈亏":"Position Floating P/L","预留份额":"Reserved Shares","参与人数":"Participants"
  },
  ro:{
    "总览大盘":"Panou general","客户中心":"Clienți","人员中心":"Personal","交易记录":"Tranzacții","持仓中心":"Poziții","行情中心":"Piețe","统计报表":"Rapoarte","系统设置":"Setări","股票份额看板":"Alocare acțiuni",
    "系统正常":"Sistem activ","退出":"Ieșire","登录系统":"Autentificare","账号":"Cont","密码":"Parolă","安全登录":"Autentificare securizată","数据库权限隔离":"Izolare acces bază de date","操作记录审计":"Jurnal de audit",
    "客户列表":"Lista clienților","新增客户":"Client nou","全部状态":"Toate stările","潜在客户":"Prospect","服务中":"În servicii","持仓中":"Cu poziții","已结束":"Închis","已归档":"Arhivat",
    "人员账户管理":"Conturi personal","新建人员账户":"Cont nou","重置密码":"Resetare parolă","禁用":"Dezactivare","启用":"Activare",
    "交易流水":"Registru tranzacții","当前持仓明细":"Poziții curente","刷新持仓":"Actualizare poziții","多国家行情":"Piețe globale","股票列表":"Instrumente",
    "管理员":"Administrator","一级人员":"Nivel 1","二级人员":"Nivel 2","客户姓名":"Nume client","性别":"Gen","男性":"Bărbat","女性":"Femeie","未填写":"Necompletat","年龄（可选）":"Vârstă (opțional)","地区（可选）":"Regiune (opțional)",
    "客户备注":"Notițe client","编辑客户备注":"Editare notițe","新增交易":"Tranzacție nouă","记录跟进":"Notă de serviciu","截图模式":"Mod captură","恢复显示":"Restabilire","返回":"Înapoi",
    "持仓成本":"Cost poziții","最新行情市值":"Valoare de piață","未实现盈亏":"P/L nerealizat","已实现盈亏":"P/L realizat","综合收益率":"Randament total","最近交易":"Ultima tranzacție",
    "客户持仓与买卖记录":"Poziții și tranzacții client","客户资料与服务纪要":"Profil client și note de serviciu","持仓结构 / 收益构成":"Alocare / structură P&L","持仓收益走势":"Evoluție P/L",
    "买入":"Cumpărare","卖出":"Vânzare","买进":"Cumpărare","时间":"Timp","数量":"Cantitate","价格":"Preț","手续费":"Comision","备注":"Notițe","保存交易":"Salvare tranzacție",
    "股票份额":"Alocare acțiuni","剩余份额":"Acțiuni rămase","已预留份额":"Acțiuni rezervate","总份额":"Total acțiuni","剩余占比":"Procent rămas","距离交易剩余时间":"Timp rămas",
    "时段预留份额":"Acțiuni rezervate pe interval","时段参与人数":"Participanți pe interval","罗马尼亚时间":"Ora României","最新数据时间":"Ora ultimei actualizări","更新时间":"Actualizat",
    "业务使用情况":"Activitate","当前账户":"Cont curent","角色":"Rol","团队人员":"Membri echipă","客户总数":"Clienți","今日交易":"Tranzacții azi","待跟进":"De urmărit","刷新":"Actualizare",
    "语言":"Limbă","交易时段":"Interval tranzacționare","份额配置":"Configurare alocare","保存设置":"Salvare setări","开盘时间":"Deschidere piață","目标交易时间":"Ora țintă",
    "跟进中":"În urmărire","搜索姓名 / 编号 / 电话":"Caută nume / ID / telefon","风险级别":"Nivel risc","低":"Scăzut","普通":"Normal","高":"Ridicat","电话（可选）":"Telefon (opțional)","邮箱（可选）":"Email (opțional)","资金规模（可选）":"Capital (opțional)","资金币种":"Monedă","客户状态":"Stare client","归属二级人员":"Responsabil Nivel 2","客户备注（由二级人员填写）":"Notițe client","保存客户资料":"Salvare client","市场":"Piață","交易类型":"Tip tranzacție","股票代码":"Simbol","股票名称":"Denumire instrument","币种":"Monedă","交易时间":"Ora tranzacției","沟通渠道":"Canal","下次跟进":"Următor serviciu","跟进内容":"Notă serviciu","保存跟进记录":"Salvare notă","姓名":"Nume","上级":"Coordonator","状态":"Stare","创建时间":"Creat","操作":"Acțiune","查看":"Vezi","客户":"Clienți","持仓":"Poziții","交易":"Tranzacții","报表":"Rapoarte","设置":"Setări","概览":"Prezentare","跟进":"Serviciu","趋势":"Tendință","成交价":"Preț","成交金额":"Valoare","持仓标的":"Instrumente deschise","当前持仓":"Poziții curente","成本基准":"Bază cost","份额看板":"Panou alocare","修改交易时段":"Modificare interval","显示规则":"Regulă afișare","公司信息":"Informații companie","我的客户":"Clienții mei","持仓客户":"Clienți cu poziții","今日买入":"Cumpărări azi","今日卖出":"Vânzări azi","累计买进":"Cumpărări totale","累计卖出":"Vânzări totale","编辑账号":"Editare cont","删除账号":"Ștergere cont","保存账号修改":"Salvare modificări","新建人员账户":"Cont personal nou","人员账户管理":"Conturi personal","最高管理员":"Administrator principal","所属一级人员":"Nivel 1 responsabil","创建账户":"Creare cont","电话":"Telefon","当前状态":"Stare curentă",
    "罗马尼亚":"România","美国":"SUA","法国":"Franța","德国":"Germania","英国":"Regatul Unit","意大利":"Italia","西班牙":"Spania","荷兰":"Țările de Jos","瑞士":"Elveția","波兰":"Polonia","日本":"Japonia",
    "首次初始化管理员":"Configurare administrator inițial","管理员 / 一级人员 / 二级人员统一入口":"Acces unic pentru Administrator / Nivel 1 / Nivel 2","系统尚未初始化，请创建第一个管理员账户。":"Sistemul nu este inițializat. Creează primul cont de administrator.","创建管理员并进入系统":"Creează administrator","客户资料":"Profil client","总览":"Prezentare",
    "填写客户偏好、重点信息、服务说明等":"Preferințe client, informații importante și note de serviciu","地区未填写":"Regiune necompletată","年龄未填写":"Vârstă necompletată","暂无交易":"Fără tranzacții","价格走势":"Evoluție preț","成本结构":"Structură cost","累计净投入":"Capital net investit","已实现":"Realizat","未实现":"Nerealizat","持仓浮动盈亏":"P/L poziție",
    "管理员拥有最高权限：一级人员直属管理员，二级人员直属一级人员；可修改、重置、禁用与删除人员账号":"Administratorul are autoritatea maximă. Nivelul 1 raportează administratorului, iar Nivelul 2 raportează Nivelului 1. Administratorul poate edita, reseta, dezactiva și șterge conturile personalului.","查看本人及名下二级人员；权限由数据库 RLS 强制执行":"Vezi propriul cont și personalul Nivel 2 alocat. Accesul este impus prin RLS în baza de date.","搜索客户 / 股票":"Caută client / instrument","当前股票暂无可用行情":"Nu există cotație disponibilă pentru acest instrument","请更换股票或市场":"Alege alt instrument sau altă piață","暂无可用行情":"Fără cotație disponibilă","行情价":"Preț piață","未知":"Necunoscut","按当前权限范围实时汇总，不使用虚拟业务数据。":"Agregare în limitele permisiunilor curente. Fără date comerciale fabricate.","客户数量":"Număr clienți","中文":"Chineză",
    "账号资料已更新":"Cont actualizat","人员账户已创建":"Cont personal creat","密码已重置":"Parolă resetată","账户状态已更新":"Stare cont actualizată","账号已删除，历史业务记录已保留":"Cont șters; istoricul comercial a fost păstrat","客户资料已保存":"Client salvat","客户备注已更新":"Notițe client actualizate","交易已保存，持仓已自动重算":"Tranzacție salvată; pozițiile au fost recalculate","跟进记录已保存":"Notă de serviciu salvată","已恢复内部操作按钮。":"Controalele interne au fost restabilite.","截图模式：仅隐藏内部归属、新增交易、记录跟进。":"Modul captură ascunde doar responsabilul intern, tranzacția nouă și nota de serviciu.","二级人员团队":"Echipă Nivel 2","团队客户":"Clienți echipă","团队买卖结构":"Structură tranzacții echipă","团队业务摘要":"Rezumat activitate echipă","直属当前一级人员":"Raportează direct Nivelului 1 curent","全部二级人员客户":"Toți clienții Nivelului 2","持有至少一个标的":"Deține cel puțin un instrument","罗马尼亚交易日":"Zi de tranzacționare România","到期服务任务":"Sarcini de serviciu scadente","二级人员详情":"Detalii Nivel 2","客户明细":"Detalii clienți","交易记录":"Înregistrări tranzacții","暂无直属二级人员":"Nu există personal Nivel 2 direct","暂无交易记录":"Nu există tranzacții","点击卡片查看客户和交易":"Apasă cardul pentru clienți și tranzacții",
    "更新":"Actualizat","行情更新":"Piață actualizată","最新数据时间（罗马尼亚）":"Ora ultimelor date (România)","数据读取失败":"Eroare la citirea datelor",
    "读取失败":"Citire eșuată","正在初始化…":"Se inițializează…","初始化失败":"Inițializare eșuată","管理员创建成功，请登录":"Administrator creat. Autentifică-te.","正在登录…":"Autentificare…","账户未启用或无系统权限":"Cont dezactivat sau fără permisiuni","未知错误":"Eroare necunoscută","已切换业务趋势":"Tendința activității selectată","正在刷新数据":"Se actualizează datele","编辑人员账号":"Editare cont personal","操作失败":"Operațiune eșuată","请输入新密码（至少 8 位）":"Introdu o parolă nouă (minimum 8 caractere)","确认禁用该账户？":"Dezactivezi acest cont?","确认启用该账户？":"Activezi acest cont?","时段记录日期必须与看板日期一致":"Data intervalului trebuie să corespundă datei panoului","时段记录必须位于有效业务时段内":"Intervalul trebuie să fie în fereastra de lucru validă","不能录入未来时段数据":"Nu se pot introduce date pentru intervale viitoare","时段预留份额合计不能超过已预留份额":"Totalul acțiunilor rezervate pe intervale nu poate depăși totalul rezervat","新增客户":"Clienți noi","成本结构":"Structură cost","累计净投入":"Capital net investit","已实现":"Realizat","未实现":"Nerealizat","持仓浮动盈亏":"P/L flotant poziții","预留份额":"Acțiuni rezervate","参与人数":"Participanți"
  }
};


Object.assign(dictionaries.en,{
  "客户股票跟踪管理系统":"Client Stock Tracking System",
  "客户、人员、买卖记录、持仓与多市场行情统一管理。":"Unified management of clients, staff, trades, positions and multi-market data.",
  "管理员姓名":"Administrator Name","一次性初始化码":"One-time Setup Code",
  "安全登录 · 数据库权限隔离 · 操作记录审计":"Secure login · Database access isolation · Audit trail",
  "页面加载失败，请点击顶部导航重新进入。":"Page failed to load. Use the top navigation to reopen it.",
  "数据量已超过当前单次加载上限，请使用筛选缩小范围。":"Data exceeds the current load limit. Narrow the range with filters.",
  "查看详情 ↗":"View Details ↗","详情 ↗":"Details ↗","股票":"Security","方向":"Side",
  "仅当前二级账户客户":"Clients assigned to this Level 2 account","持有至少 1 个标的":"Holding at least 1 security",
  "完整买入流水":"Complete buy ledger","完整卖出流水":"Complete sell ledger","客户持仓总览":"Client Holdings Overview",
  "自动来自买卖流水":"Automatically calculated from trade ledger","平均成本":"Average Cost","暂无客户持仓":"No client positions",
  "买卖结构":"Buy / Sell Mix","账户业务汇总":"Account Summary","持仓成本基准":"Position Cost Basis","交易总数":"Total Trades",
  "最近买进 / 卖出明细":"Recent Buy / Sell Details","暂无买卖记录":"No buy/sell records","暂无近期交易":"No recent trades",
  "客户编号":"Client ID","地区":"Region","负责人":"Owner","建立时间":"Created","暂无客户数据":"No client data",
  "按当前账户权限管理客户资料、交易与跟进":"Manage client profiles, trades and service notes within current permissions",
  "暂无数据":"No data","保存备注":"Save Notes","页面生成：":"Generated:","按最新可用行情计算":"Calculated from latest available market data",
  "基于当前可用行情":"Based on current available market data","买入 / 卖出节点 · 罗马尼亚时间":"Buy / Sell points · Romania time",
  "基于当前行情序列":"Based on current market series","持仓占比":"Position Allocation","收益构成":"P/L Composition",
  "资金规模":"Capital","服务状态":"Service Status","暂无客户备注":"No client notes","暂无服务纪要":"No service notes",
  "内部归属：":"Internal owner:","行情来自免费公开市场数据源":"Market data from free public sources","页面以各行情的最新更新时间为准。":"Values follow each source's latest update time.",
  "市值":"Market Value","暂无持仓数据":"No position data","当前持仓暂无可用价格序列":"No price series available for current positions",
  "当前持仓暂无可用收益序列":"No P/L series available for current positions","其他":"Other","邮件":"Email","会议":"Meeting",
  "请选择":"Select","当前权限范围内全部客户买入 / 卖出流水":"All client buy / sell records within current permissions",
  "持仓由此自动计算":"Positions are calculated automatically","类型":"Type",
  "使用免费公开行情源的最新可用报价，并显示数据更新时间":"Uses latest available quotes from free public market sources with update times",
  "免费公开行情源 · 显示最新报价与罗马尼亚时间":"Free public market data · latest available quotes · Romania time",
  "选择股票":"Select Security","罗马尼亚、美国、法国、德国、英国、意大利、西班牙、荷兰、瑞士、波兰、日本":"Romania, United States, France, Germany, United Kingdom, Italy, Spain, Netherlands, Switzerland, Poland, Japan",
  "暂无行情数据":"No market data","客户归属分布":"Client Ownership Distribution","按二级负责人统计":"Grouped by Level 2 owner",
  "交易记录数量":"Trade count","人员客户统计":"Staff Client Statistics","按角色层级计算可见客户数量":"Visible client counts calculated by role hierarchy",
  "人员":"Staff","暂无人员数据":"No staff data","登录身份":"Signed-in Identity","行情数据":"Market Data","覆盖市场":"Covered Markets",
  "最新报价 + 罗马尼亚更新时间":"Latest quote + Romania update time","股票名称 / 代码自动搜索":"Automatic security name / symbol search",
  "总":"D","客":"C","持":"P","交":"T","报":"R","设":"S","连接中":"Connecting","数据异常":"Data Error","重置密码":"Reset Password","人员账号":"Staff Account","新密码":"New Password","确认新密码":"Confirm Password","取消":"Cancel","确认重置":"Confirm Reset","两次输入的密码不一致":"Passwords do not match","禁用账号":"Disable Account","启用账号":"Enable Account","确认禁用":"Confirm Disable","确认启用":"Confirm Enable","删除账号":"Delete Account","确认删除账号？":"Delete this account?","删除后该账号将无法登录，但历史业务记录会保留。存在客户或下级人员时系统会阻止删除。":"The account will no longer be able to sign in, while historical business records are retained. Deletion is blocked while clients or subordinate staff remain.","确认删除":"Confirm Delete"
});
Object.assign(dictionaries.ro,{
  "客户股票跟踪管理系统":"Sistem de urmărire a acțiunilor clienților",
  "客户、人员、买卖记录、持仓与多市场行情统一管理。":"Administrare unificată pentru clienți, personal, tranzacții, poziții și date multi-piață.",
  "管理员姓名":"Nume administrator","一次性初始化码":"Cod unic de configurare",
  "安全登录 · 数据库权限隔离 · 操作记录审计":"Autentificare sigură · Izolare acces bază de date · Jurnal de audit",
  "页面加载失败，请点击顶部导航重新进入。":"Pagina nu s-a încărcat. Folosește navigarea de sus pentru a reintra.",
  "数据量已超过当前单次加载上限，请使用筛选缩小范围。":"Volumul de date depășește limita curentă. Restrânge intervalul cu filtre.",
  "查看详情 ↗":"Vezi detalii ↗","详情 ↗":"Detalii ↗","股票":"Instrument","方向":"Direcție",
  "仅当前二级账户客户":"Clienții alocați acestui cont Nivel 2","持有至少 1 个标的":"Deține cel puțin 1 instrument",
  "完整买入流水":"Registru complet cumpărări","完整卖出流水":"Registru complet vânzări","客户持仓总览":"Prezentare poziții clienți",
  "自动来自买卖流水":"Calculat automat din registrul tranzacțiilor","平均成本":"Cost mediu","暂无客户持仓":"Fără poziții ale clienților",
  "买卖结构":"Structură cumpărări / vânzări","账户业务汇总":"Rezumat cont","持仓成本基准":"Bază cost poziții","交易总数":"Total tranzacții",
  "最近买进 / 卖出明细":"Detalii recente cumpărări / vânzări","暂无买卖记录":"Fără înregistrări de cumpărare/vânzare","暂无近期交易":"Fără tranzacții recente",
  "客户编号":"ID client","地区":"Regiune","负责人":"Responsabil","建立时间":"Creat","暂无客户数据":"Fără date client",
  "按当前账户权限管理客户资料、交易与跟进":"Administrează profiluri, tranzacții și note de serviciu în limitele permisiunilor curente",
  "暂无数据":"Fără date","保存备注":"Salvare notițe","页面生成：":"Generat:","按最新可用行情计算":"Calculat din cele mai recente date de piață disponibile",
  "基于当前可用行情":"Pe baza datelor de piață disponibile","买入 / 卖出节点 · 罗马尼亚时间":"Puncte cumpărare / vânzare · ora României",
  "基于当前行情序列":"Pe baza seriei de piață curente","持仓占比":"Alocare poziții","收益构成":"Compoziție P/L",
  "资金规模":"Capital","服务状态":"Stare serviciu","暂无客户备注":"Fără notițe client","暂无服务纪要":"Fără note de serviciu",
  "内部归属：":"Responsabil intern:","行情来自免费公开市场数据源":"Date de piață din surse publice gratuite","页面以各行情的最新更新时间为准。":"Valorile urmează ultima actualizare a fiecărei surse.",
  "市值":"Valoare de piață","暂无持仓数据":"Fără date de poziție","当前持仓暂无可用价格序列":"Nu există serie de preț disponibilă pentru pozițiile curente",
  "当前持仓暂无可用收益序列":"Nu există serie P/L disponibilă pentru pozițiile curente","其他":"Altele","邮件":"Email","会议":"Întâlnire",
  "请选择":"Selectează","当前权限范围内全部客户买入 / 卖出流水":"Toate tranzacțiile clienților din limitele permisiunilor curente",
  "持仓由此自动计算":"Pozițiile sunt calculate automat","类型":"Tip",
  "使用免费公开行情源的最新可用报价，并显示数据更新时间":"Folosește cele mai recente cotații disponibile din surse publice gratuite și afișează ora actualizării",
  "免费公开行情源 · 显示最新报价与罗马尼亚时间":"Date publice gratuite · cele mai recente cotații · ora României",
  "选择股票":"Selectează instrument","罗马尼亚、美国、法国、德国、英国、意大利、西班牙、荷兰、瑞士、波兰、日本":"România, SUA, Franța, Germania, Regatul Unit, Italia, Spania, Țările de Jos, Elveția, Polonia, Japonia",
  "暂无行情数据":"Fără date de piață","客户归属分布":"Distribuția clienților","按二级负责人统计":"Grupat după responsabilul Nivel 2",
  "交易记录数量":"Număr tranzacții","人员客户统计":"Statistici clienți/personal","按角色层级计算可见客户数量":"Numărul de clienți vizibili calculat după ierarhia rolurilor",
  "人员":"Personal","暂无人员数据":"Fără date personal","登录身份":"Identitate conectată","行情数据":"Date de piață","覆盖市场":"Piețe acoperite",
  "最新报价 + 罗马尼亚更新时间":"Ultima cotație + ora actualizării în România","股票名称 / 代码自动搜索":"Căutare automată după nume / simbol",
  "总":"G","客":"C","持":"P","交":"T","报":"R","设":"S","连接中":"Conectare","数据异常":"Eroare date","重置密码":"Resetare parolă","人员账号":"Cont personal","新密码":"Parolă nouă","确认新密码":"Confirmă parola","取消":"Anulare","确认重置":"Confirmă resetarea","两次输入的密码不一致":"Parolele nu coincid","禁用账号":"Dezactivare cont","启用账号":"Activare cont","确认禁用":"Confirmă dezactivarea","确认启用":"Confirmă activarea","删除账号":"Ștergere cont","确认删除账号？":"Ștergi acest cont?","删除后该账号将无法登录，但历史业务记录会保留。存在客户或下级人员时系统会阻止删除。":"Contul nu se va mai putea autentifica, iar istoricul comercial va fi păstrat. Ștergerea este blocată dacă există clienți sau personal subordonat.","确认删除":"Confirmă ștergerea"
});

export function getLang(){return localStorage.getItem(LANG_KEY)||"zh"}
export function setLang(lang){const v=["zh","en","ro"].includes(lang)?lang:"zh";localStorage.setItem(LANG_KEY,v);return v}
export function localeFor(lang){return lang==="ro"?"ro-RO":lang==="en"?"en-GB":"zh-CN"}
export function tr(text,lang=getLang()){
  if(lang==="zh")return text;
  return dictionaries[lang]?.[text]||text;
}
export function translateUI(root=document,lang=getLang()){
  if(lang==="zh")return;
  const dict=dictionaries[lang]||{};
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];let n;while((n=walker.nextNode()))nodes.push(n);
  for(const node of nodes){
    const raw=node.nodeValue,trim=raw.trim();
    if(trim&&dict[trim])node.nodeValue=raw.replace(trim,dict[trim]);
  }
  root.querySelectorAll?.("[placeholder],[title],[aria-label]").forEach(el=>{
    for(const attr of ["placeholder","title","aria-label"]){
      const v=el.getAttribute(attr);if(v&&dict[v])el.setAttribute(attr,dict[v]);
    }
  });
}
export function languageOptions(lang){
  return `<option value="zh" ${lang==="zh"?"selected":""}>中文</option><option value="en" ${lang==="en"?"selected":""}>English</option><option value="ro" ${lang==="ro"?"selected":""}>Română</option>`;
}
export function roleLabel(role,lang=getLang()){
  const zh=role==="admin"?"管理员":role==="level1"?"一级人员":"二级人员";
  return tr(zh,lang);
}
export function customerStatusLabel(status,lang=getLang()){
  const zh=({prospect:"潜在客户",following:"服务中",holding:"持仓中",closed:"已结束",archived:"已归档"})[status]||status;
  return tr(zh,lang);
}

function fmtNumber(v,d=2,lang=getLang()){
  return Number(v||0).toLocaleString(localeFor(lang),{maximumFractionDigits:d});
}
function timeHHMM(v){
  if(!v)return"--:--";
  const d=new Date(v);if(Number.isNaN(d.getTime()))return"--:--";
  return new Intl.DateTimeFormat(localeFor(),{timeZone:"Europe/Bucharest",hour:"2-digit",minute:"2-digit",hour12:false}).format(d);
}
function minutesOfRomania(ts){
  const p=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Bucharest",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date(ts));
  const o=Object.fromEntries(p.map(x=>[x.type,x.value]));
  return Number(o.hour)*60+Number(o.minute);
}
function hhmmToMinutes(v){
  const m=String(v||"00:00").match(/(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):0;
}
function safePct(v){return Number.isFinite(Number(v))?Number(v):null}

export function miniCandlesHTML(points=[],label=""){
  const p=points.filter(x=>x&&x.close!=null).slice(-18);
  if(!p.length)return '<div class="miniNoData">--</div>';
  const all=p.flatMap(x=>[x.high??x.close,x.low??x.close]).map(Number).filter(Number.isFinite);
  const lo=Math.min(...all),hi=Math.max(...all),span=Math.max(hi-lo,0.000001);
  const candles=p.map((x,i)=>{
    const o=Number(x.open??x.close),c=Number(x.close),h=Number(x.high??Math.max(o,c)),l=Number(x.low??Math.min(o,c));
    const top=(hi-h)/span*100,bottom=(l-lo)/span*100;
    const bodyTop=(hi-Math.max(o,c))/span*100,bodyBottom=(Math.min(o,c)-lo)/span*100;
    const bodyH=Math.max(6,100-bodyTop-bodyBottom);
    const stamp=x.t?timeHHMM(x.t):"--:--";
    const tip=`${stamp}  O ${fmtNumber(o,2)}  H ${fmtNumber(h,2)}  L ${fmtNumber(l,2)}  C ${fmtNumber(c,2)}`;
    return `<i class="miniCandle ${c>=o?"upC":"downC"}" title="${tip}" style="--x:${i};--top:${top}%;--bottom:${bottom}%;--bodyTop:${bodyTop}%;--bodyH:${bodyH}%"></i>`;
  }).join("");
  return `<div class="miniCandleWrap"><div class="miniCandleLabel">${label}</div><div class="miniCandles" style="--count:${p.length}">${candles}</div></div>`;
}
function calcRSI(points=[],period=14){
  const c=points.filter(x=>x?.close!=null).map(x=>Number(x.close)).filter(Number.isFinite);
  if(c.length<period+1)return[];
  const out=[];
  for(let i=period;i<c.length;i++){
    let gain=0,loss=0;
    for(let j=i-period+1;j<=i;j++){const d=c[j]-c[j-1];if(d>0)gain+=d;else loss-=d}
    const rs=loss===0?100:gain/loss;out.push(100-(100/(1+rs)));
  }
  return out.slice(-24);
}
export function miniRSIHTML(points=[]){
  const r=calcRSI(points);
  if(!r.length)return '<div class="miniIndicator"><span>RSI</span><b>--</b></div>';
  const w=180,h=54;
  const pts=r.map((v,i)=>`${(i/(Math.max(1,r.length-1))*w).toFixed(1)},${(h-(v/100*h)).toFixed(1)}`).join(" ");
  return `<div class="miniIndicator" title="RSI(14): ${fmtNumber(r.at(-1),1)}"><div class="miniIndicatorHead"><span>RSI(14)</span><b>${fmtNumber(r.at(-1),1)}</b></div><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><line x1="0" y1="${h*.3}" x2="${w}" y2="${h*.3}" /><line x1="0" y1="${h*.7}" x2="${w}" y2="${h*.7}" /><polyline points="${pts}"/></svg></div>`;
}

function energyColor(ratio){return ratio<20?"#f2b544":"#00d59b";}
function countdownText(ctx,target){
  const date=ctx.romaniaDateKey();
  const iso=ctx.romaniaLocalToISO(date+"T"+String(target||"14:30").slice(0,5));
  const ms=new Date(iso).getTime()-Date.now();
  if(!Number.isFinite(ms)||ms<=0)return"00:00:00";
  const s=Math.floor(ms/1000),hh=Math.floor(s/3600),mm=Math.floor((s%3600)/60),ss=s%60;
  return [hh,mm,ss].map(x=>String(x).padStart(2,"0")).join(":");
}
function indexName(symbol){
  return ({"^GSPC":"S&P 500","^DJI":"Dow Jones","^IXIC":"Nasdaq","^FCHI":"CAC 40","BET.RO":"BET","^GDAXI":"DAX","^FTSE":"FTSE 100","FTSEMIB.MI":"FTSE MIB","^IBEX":"IBEX 35","^AEX":"AEX","^SSMI":"SMI","WIG20.WA":"WIG20","^N225":"Nikkei 225"})[symbol]||symbol;
}
function marketWall(rows,ctx){
  return rows.map(x=>{
    const ok=x&&!x.error&&validQuotePrice(x.price),pct=ok&&x.changePct!=null?Number(x.changePct):null;
    return `<article class="indexTile">
      <div class="indexTileHead"><span>${indexName(x?.symbol||"--")}</span><small>${x?.lastTradeAt?timeHHMM(x.lastTradeAt):"--:--"}</small></div>
      <div class="indexTilePrice">${ok?fmtNumber(x.price,2):"--"}</div>
      <div class="indexTilePct ${pct==null?"":pct>=0?"up":"down"}">${pct==null?"--":(pct>=0?"+":"")+fmtNumber(pct,2)+"%"}</div>
      ${miniCandlesHTML(x?.points||[])}
    </article>`;
  }).join("");
}

function matchingSecurity(symbol,info){
  return info&&!info.error&&String(info.symbol||"").toUpperCase()===String(symbol||"").toUpperCase()?info:null;
}
function validQuotePrice(value){return value!=null&&Number.isFinite(Number(value));}
function boardQuote(symbol,security,quote){
  const info=matchingSecurity(symbol,security),market=matchingSecurity(symbol,quote);
  const latest=market&&validQuotePrice(market.price)?{...info,...market}:info&&validQuotePrice(info.price)?info:null;
  if(!latest)return null;
  const usable=rows=>(rows||[]).filter(p=>p&&p.close!=null&&Number.isFinite(Number(p.close))&&Number.isFinite(new Date(p.t).getTime()));
  const marketPoints=usable(market?.points),infoPoints=usable(info?.points);
  return {...latest,points:marketPoints.length>=2?marketPoints:infoPoints.length>=2?infoPoints:marketPoints};
}
function allocationChartOptions(base){
  return {...base,animation:false,plugins:{...base.plugins,legend:{...base.plugins?.legend,display:false}},scales:{...base.scales,x:{...base.scales?.x,ticks:{...base.scales?.x?.ticks,autoSkip:true,maxTicksLimit:8,minRotation:0,maxRotation:0}}}};
}

export async function renderShareBoard(ctx){
  const {state,$,fetchQuotes,esc,num,dt,chartOpts}=ctx;
  if(state.profile?.role!=="admin"){ctx.toast("仅管理员可访问",true);ctx.switchView("dashboard");return}
  const board=state.shareBoard;
  if(!board){
    $("#main").innerHTML=`<article class="panel shareBoardEmpty"><div><h2>股票份额看板尚未配置</h2><p>请在管理员总览使用“份额配置”完成股票、总份额和剩余份额设置。</p></div></article>`;
    return;
  }
  const symbols=["^GSPC","^DJI","^IXIC","^FCHI","BET.RO","^GDAXI","^FTSE","FTSEMIB.MI","^IBEX","^AEX","^SSMI","WIG20.WA","^N225"];
  const [rawSecurity,quotes,boardQuotes]=await Promise.all([
    fetch("/api/security-info?symbol="+encodeURIComponent(board.symbol)).then(r=>r.ok?r.json():null).catch(()=>null),
    fetchQuotes(symbols,{realtimeOnly:false}),
    fetchQuotes([board.symbol],{realtimeOnly:false})
  ]);
  const security=matchingSecurity(board.symbol,rawSecurity);
  const rows=symbols.map(s=>quotes[s]||{symbol:s,error:true});
  const total=Number(board.total_shares||0),remaining=Number(board.remaining_shares||0),reserved=Math.max(0,total-remaining);
  const ratio=total?Math.max(0,Math.min(100,remaining/total*100)):0;
  const color=energyColor(ratio);
  const chartColor="#d7ad24";
  const settings=state.appSettings||{market_open_time:"09:30",target_trade_time:"14:30",energy_high:60,energy_low:30};
  const openMin=hhmmToMinutes(settings.market_open_time),targetMin=hhmmToMinutes(settings.target_trade_time);
  const cap=Math.min(openMin,targetMin>0?targetMin:openMin);
  const todayKey=ctx.romaniaDateKey();
  const boardDate=String(board.board_date||todayKey);
  const nowMin=minutesOfRomania(Date.now());
  const effectiveCap=boardDate>todayKey?-1:boardDate===todayKey?Math.min(cap,nowMin):cap;
  const validSlots=(state.shareSlots||[]).filter(s=>{
    const m=minutesOfRomania(s.slot_at);
    return ctx.romaniaDateKey(s.slot_at)===boardDate && m>=360 && m<=effectiveCap;
  }).sort((a,b)=>new Date(a.slot_at)-new Date(b.slot_at));
  const marketQuote=boardQuotes[board.symbol];
  const latest=boardQuote(board.symbol,security,marketQuote);
  const companyName=security?.companyName||matchingSecurity(board.symbol,marketQuote)?.name||"公司信息暂不可用";
  const exchange=security?.exchange||latest?.exchange||"—";
  const currency=latest?.currency||security?.currency||board.currency||"—";
  const allocationAmount=value=>({USD:"$",EUR:"€",GBP:"£",JPY:"¥",CHF:"CHF ",RON:"RON "}[currency]||currency+" ")+num(value,2);
  const industry=security?.industry||"";
  const reservedPct=total?Math.max(0,Math.min(100,reserved/total*100)):0;
  const quoteState=latest?(latest.realtime?"实时行情":latest.delaySeconds?"延迟行情":"可用行情"):"暂无行情";
  const boardState=boardDate===todayKey?"今日看板":boardDate>todayKey?"待开始":"历史看板";
  const marketPoints=(latest?.points||[]).filter(p=>p&&p.close!=null&&Number.isFinite(Number(p.close))).slice(-40);
  const hasMarketSeries=marketPoints.length>=2;
  const slotRowsHTML=validSlots.map((s,i)=>`<tr>
    <td>${timeHHMM(s.slot_at)}</td>
    <td>${allocationAmount(Number(s.reserved_shares||0))}</td>
    <td>${num(Number(s.participant_count||0),0)}</td>
    <td><span class="allocationStateTag ${i===validSlots.length-1?"active":""}">${i===validSlots.length-1?"最新":"有效"}</span></td>
  </tr>`).join("")||'<tr><td colspan="4"><div class="allocationCompactEmpty">暂无有效时段记录</div></td></tr>';
  $("#main").innerHTML=`
    <section class="allocationBoard allocationBoardV3" style="--energy-color:${color};--slots-row:${validSlots.length?176:86}px">
      <article class="panel exchangeQuoteHeader">
        <div class="exchangeSecurityIdentity">
          <div class="allocationSymbolBlock">
            <span class="eyebrow">SHARE ALLOCATION · ${esc(board.symbol)}</span>
            <h1>${esc(board.symbol)}</h1>
          </div><div class="allocationCompanyBlock">
            <p id="allocationCompanyName" class="allocationCompanyName">${esc(companyName)}</p>
            <p id="allocationSecurityMeta">${esc([exchange,currency,industry].filter(Boolean).join(" · "))}</p>
          </div>
          <button class="btn allocationConfigCompact" id="allocationConfigBtn" type="button">配置</button>
        </div>
        <div class="exchangeQuoteBlock">
          <span>最新价</span>
          <strong id="allocationQuotePrice">${latest?fmtNumber(latest.price,2):"--"}</strong>
          <b class="${safePct(latest?.changePct)>=0?"up":"down"}" id="allocationQuoteChange">${latest&&latest.changePct!=null?(Number(latest.changePct)>=0?"+":"")+fmtNumber(latest.changePct,2)+"%":"--"}</b>
          <small id="allocationQuoteTime">${latest?.lastTradeAt?dt(latest.lastTradeAt):"--"}</small>
        </div>
        <div class="exchangeQuoteMini" id="allocationMini">${miniCandlesHTML(latest?.points||[],board.symbol)}</div>
        <div class="exchangeStatusRail">
          <span id="allocationQuoteState" class="${latest?"live":"muted"}">${quoteState}</span>
          <span>${boardState}</span>
          <span>时段 ${validSlots.length}</span>
        </div>
      </article>

      <div class="allocationKpiStrip exchangeKpiStrip">
        <article class="panel allocationKpiCard"><span>总份额</span><strong>${num(total,2)}</strong><small>TOTAL SHARES</small></article>
        <article class="panel allocationKpiCard"><span>已预留份额</span><strong>${allocationAmount(reserved)}</strong><small>${fmtNumber(reservedPct,2)}%</small></article>
        <article class="panel allocationKpiCard gold"><span>剩余份额</span><strong>${allocationAmount(remaining)}</strong><small>${fmtNumber(ratio,2)}%</small></article>
        <article class="panel allocationKpiCard"><span>目标交易时间</span><strong>${String(settings.target_trade_time||"14:30").slice(0,5)}</strong><small>ROMANIA / BUCHAREST</small></article>
        <article class="panel allocationKpiCard countdown"><span>距离交易剩余</span><strong id="allocationCountdown">${countdownText(ctx,settings.target_trade_time)}</strong><small id="allocationRomaniaClock">${ctx.romaniaClockText()}</small></article>
      </div>

      <div class="exchangeBoardMain">
        <article class="panel exchangeChartPanel">
          <div class="panelHead compact">
            <div><h2 id="allocationChartTitle">${hasMarketSeries?"行情走势":"时段预留趋势"}</h2><p id="allocationChartSubtitle">${hasMarketSeries?"MARKET PRICE SERIES · ROMANIA TIME":"RESERVATION TREND · ROMANIA BUSINESS SLOTS"}</p></div>
            <span class="headMeta" id="allocationChartMeta">${esc(board.symbol)} · ${quoteState}</span>
          </div>
          <div class="chartBox exchangePrimaryChart"><canvas id="allocationMarketChart"></canvas></div>
        </article>

        <div class="exchangeSideStack">
          <article class="panel allocationDistributionPanel">
            <div class="panelHead compact"><div><h2>份额结构</h2><p>ALLOCATION STRUCTURE</p></div><span class="headMeta">${esc(board.symbol)}</span></div>
            <div class="allocationDistributionBody"><div class="allocationRemainingHero"><span>剩余份额占比</span><strong>${fmtNumber(ratio,2)}<small>%</small></strong><p>${ratio<20?"剩余份额低于 20%":"可预留份额"}</p></div>
              <div class="allocationDistRow">
                <div><span>剩余份额</span><b>${allocationAmount(remaining)}</b></div>
                <div class="allocationBar"><i style="width:${ratio}%"></i></div>
                <small>${fmtNumber(ratio,2)}%</small>
              </div>
              <div class="allocationDistRow reserved">
                <div><span>已预留份额</span><b>${allocationAmount(reserved)}</b></div>
                <div class="allocationBar"><i style="width:${reservedPct}%"></i></div>
                <small>${fmtNumber(reservedPct,2)}%</small>
              </div>
            </div>
          </article>

        </div>
      </div>

      <div class="globalIndexWall exchangeTickerWall" id="globalIndexWall">${marketWall(rows,ctx)}</div>

      <article class="panel allocationSlotsPanel ${validSlots.length?"":"is-empty"}">
        <div class="panelHead compact">
          <div><h2>有效时段记录</h2><p>ROMANIA BUSINESS SLOTS</p></div>
          <span class="headMeta">${validSlots.length} RECORDS</span>
        </div>
        <div class="tableWrap allocationSlotsTable">
          <table class="dataTable">
            <thead><tr><th>时间</th><th>预留份额</th><th>参与人数</th><th>状态</th></tr></thead>
            <tbody>${slotRowsHTML}</tbody>
          </table>
        </div>
      </article>


    </section>`;

  const drawAllocationChart=quote=>{
    const points=(quote?.points||[]).filter(p=>p&&p.close!=null&&Number.isFinite(Number(p.close))).slice(-40);
    const market=points.length>=2;
    const series=market?points:validSlots;
    const title=$("#allocationChartTitle"),subtitle=$("#allocationChartSubtitle");
    if(title)title.textContent=market?"行情走势":"时段预留趋势";
    if(subtitle)subtitle.textContent=market?"MARKET PRICE SERIES · ROMANIA TIME":"RESERVATION TREND · ROMANIA BUSINESS SLOTS";
    let existing=state.charts.allocationMarket;
    if(existing&&existing.canvas!==$("#allocationMarketChart")){existing.destroy();delete state.charts.allocationMarket;existing=null;}
    if(!series.length){if(existing)existing.destroy();delete state.charts.allocationMarket;$(".exchangePrimaryChart").innerHTML='<div class="allocationCompactEmpty">暂无可用行情序列或有效时段记录</div>';return}
    const labels=series.map(p=>timeHHMM(market?p.t:p.slot_at));
    const values=series.map(p=>Number(market?p.close:p.reserved_shares||0));
    const label=market?board.symbol:tr("预留份额");
    if(existing){existing.data.labels=labels;existing.data.datasets[0].label=label;existing.data.datasets[0].data=values;existing.resize();existing.update("none");return}
    if(!$("#allocationMarketChart"))$(".exchangePrimaryChart").innerHTML='<canvas id="allocationMarketChart"></canvas>';
    state.charts.allocationMarket=new Chart($("#allocationMarketChart"),{type:"line",data:{labels,datasets:[{label,data:values,borderColor:chartColor,backgroundColor:chartColor+"16",fill:true,tension:.22,pointRadius:0,pointHoverRadius:4}]},options:allocationChartOptions(chartOpts())});
  };
  drawAllocationChart(latest);
  const configBtn=$("#allocationConfigBtn");
  if(configBtn)configBtn.onclick=()=>openShareBoardConfig(ctx);
  clearInterval(state.allocationClockTimer);
  state.allocationClockTimer=setInterval(()=>{
    const c=$("#allocationRomaniaClock"),d=$("#allocationCountdown");
    if(c)c.textContent=ctx.romaniaClockText();
    if(d)d.textContent=countdownText(ctx,settings.target_trade_time);
  },1000);

  if(state.shareBoardRefreshTimer)clearInterval(state.shareBoardRefreshTimer);
  const refreshMs=Math.max(10000,Number(settings.share_board_refresh_seconds||60)*1000);
  state.shareBoardRefreshTimer=setInterval(async()=>{
    if(state.activeView!=="shareboard"||!$("#globalIndexWall")){
      clearInterval(state.shareBoardRefreshTimer);state.shareBoardRefreshTimer=null;return;
    }
    try{
      const [freshSecurity,freshQuotes,freshBoardQuotes]=await Promise.all([
        fetch("/api/security-info?symbol="+encodeURIComponent(board.symbol)).then(r=>r.ok?r.json():null).catch(()=>null),
        fetchQuotes(symbols,{realtimeOnly:false}),
        fetchQuotes([board.symbol],{realtimeOnly:false})
      ]);
      if(state.activeView!=="shareboard"||!$("#globalIndexWall"))return;
      const freshRows=symbols.map(s=>freshQuotes[s]||{symbol:s,error:true});
      const marketFresh=freshBoardQuotes[board.symbol];
      const freshLatest=boardQuote(board.symbol,freshSecurity,marketFresh);
      const freshInfo=matchingSecurity(board.symbol,freshSecurity);
      const companyEl=$("#allocationCompanyName"),metaEl=$("#allocationSecurityMeta"),statusEl=$("#allocationQuoteState");
      if(companyEl)companyEl.textContent=freshInfo?.companyName||matchingSecurity(board.symbol,marketFresh)?.name||"公司信息暂不可用";
      if(metaEl)metaEl.textContent=[freshInfo?.exchange||freshLatest?.exchange||"—",freshLatest?.currency||freshInfo?.currency||"—",freshInfo?.industry].filter(Boolean).join(" · ");
      if(statusEl){statusEl.textContent=freshLatest?(freshLatest.realtime?"实时行情":freshLatest.delaySeconds?"延迟行情":"可用行情"):"暂无行情";statusEl.className=freshLatest?"live":"muted";}
      const wall=$("#globalIndexWall");if(wall)wall.innerHTML=marketWall(freshRows,ctx);
      const priceEl=$("#allocationQuotePrice"),changeEl=$("#allocationQuoteChange"),timeEl=$("#allocationQuoteTime"),mini=$("#allocationMini");
      if(priceEl)priceEl.textContent=freshLatest&&validQuotePrice(freshLatest.price)?fmtNumber(freshLatest.price,2):"--";
      if(changeEl){
        const pct=safePct(freshLatest?.changePct);
        changeEl.textContent=pct==null?"--":(pct>=0?"+":"")+fmtNumber(pct,2)+"%";
        changeEl.className=pct==null?"":pct>=0?"up":"down";
      }
      if(timeEl)timeEl.textContent=freshLatest?.lastTradeAt?dt(freshLatest.lastTradeAt):"--";
      if(mini)mini.innerHTML=miniCandlesHTML(freshLatest?.points||[],board.symbol);
      const freshState=freshLatest?(freshLatest.realtime?"实时行情":freshLatest.delaySeconds?"延迟行情":"可用行情"):"暂无行情";
      const sessionStatus=$("#allocationSessionQuoteState"),chartMeta=$("#allocationChartMeta");
      if(sessionStatus)sessionStatus.textContent=freshState;
      if(chartMeta)chartMeta.textContent=board.symbol+" · "+freshState;
      drawAllocationChart(freshLatest);
    }catch{}
  },refreshMs);
}

export function openTimeSettings(ctx){
  if(ctx.state.profile?.role!=="admin")return;
  const s=ctx.state.appSettings||{};
  ctx.modal("交易时段",`<form id="timeSettingsForm" class="formGrid">
    <div class="field"><label>开盘时间</label><input class="input" type="time" name="market_open_time" value="${String(s.market_open_time||"09:30").slice(0,5)}" required></div>
    <div class="field"><label>目标交易时间</label><input class="input" type="time" name="target_trade_time" value="${String(s.target_trade_time||"14:30").slice(0,5)}" required></div>
    <div class="field"><label>默认语言</label><select class="select" name="default_language">${languageOptions(s.default_language||ctx.state.lang||"zh")}</select></div>
    <div class="field"><label>看板刷新秒数</label><input class="input" type="number" min="10" max="3600" name="share_board_refresh_seconds" value="${Number(s.share_board_refresh_seconds||60)}"></div>
    <div class="field full"><button class="btn primary" type="submit">保存设置</button></div>
  </form>`);
  ctx.$("#timeSettingsForm").onsubmit=async e=>{
    e.preventDefault();const b=Object.fromEntries(new FormData(e.currentTarget).entries());
    b.id=1;b.share_board_refresh_seconds=Number(b.share_board_refresh_seconds||60);b.updated_at=new Date().toISOString();
    const {error}=await ctx.supabase.from("app_settings").upsert(b,{onConflict:"id"});
    if(error){ctx.toast(error.message,true);return}
    ctx.closeModal();ctx.toast("设置已保存");await ctx.refreshAll();
  };
}

export function openShareBoardConfig(ctx){
  if(ctx.state.profile?.role!=="admin")return;
  const b=ctx.state.shareBoard;
  ctx.modal("份额配置",`<div class="shareConfigWrap">
    <div class="field"><label>股票名称或代码</label><div class="searchInline"><input id="securityQuery" class="input" value="${ctx.esc(b?.symbol||"")}" placeholder="AAPL / Apple / TLV.RO"><button class="btn" id="securitySearchBtn" type="button">查询</button></div></div>
    <div id="securitySearchResults" class="securitySearchResults"></div>
    <form id="shareBoardForm" class="formGrid">
      <input type="hidden" name="id" value="${ctx.esc(b?.id||"")}">
      <div class="field"><label>股票代码</label><input class="input" name="symbol" value="${ctx.esc(b?.symbol||"")}" required></div>
      <div class="field"><label>公司名称</label><input class="input" name="company_name" value="${ctx.esc(b?.company_name||"")}"></div>
      <div class="field"><label>交易所</label><input class="input" name="exchange" value="${ctx.esc(b?.exchange||"")}"></div>
      <div class="field"><label>币种</label><input class="input" name="currency" value="${ctx.esc(b?.currency||"USD")}"></div>
      <div class="field"><label>总份额</label><input class="input" type="number" min="0.0001" step="0.0001" name="total_shares" value="${b?.total_shares??""}" required></div>
      <div class="field"><label>剩余份额</label><input class="input" type="number" min="0" step="0.0001" name="remaining_shares" value="${b?.remaining_shares??""}" required></div>
      <div class="field"><label>看板日期</label><input class="input" type="date" name="board_date" value="${b?.board_date||ctx.romaniaDateKey()}" required></div>
      <div class="field full"><button class="btn primary" type="submit">保存份额看板</button></div>
    </form>
    <div class="slotEditorHead"><span>时段预留数据</span><button id="addSlotBtn" class="btn" type="button">添加时段记录</button></div>
    <div id="slotEditorRows" class="slotEditorRows"></div>
  </div>`);

  const renderSlots=()=>{
    const rows=ctx.state.shareSlots||[];
    ctx.$("#slotEditorRows").innerHTML=rows.map(s=>`<div class="slotRow"><span>${ctx.dt(s.slot_at)}</span><span>预留 ${ctx.num(s.reserved_shares,2)}</span><span>人数 ${ctx.num(s.participant_count,0)}</span></div>`).join("")||'<div class="empty">暂无时段记录</div>';
  };
  renderSlots();

  ctx.$("#securitySearchBtn").onclick=async()=>{
    const q=ctx.$("#securityQuery").value.trim();if(!q)return;
    const box=ctx.$("#securitySearchResults");box.innerHTML='<div class="empty">查询中…</div>';
    try{
      const r=await fetch("/api/security-search?q="+encodeURIComponent(q));const j=await r.json();
      box.innerHTML=(j.rows||[]).map(x=>`<button type="button" class="securityResult" data-symbol="${ctx.esc(x.symbol)}"><b>${ctx.esc(x.symbol)}</b><span>${ctx.esc(x.name||x.symbol)}</span><small>${ctx.esc(x.exchangeDisplay||x.exchange||"")}</small></button>`).join("")||'<div class="empty">没有找到匹配股票</div>';
      ctx.$$(".securityResult",box).forEach(btn=>btn.onclick=async()=>{
        const symbol=btn.dataset.symbol;
        const ir=await fetch("/api/security-info?symbol="+encodeURIComponent(symbol));const info=await ir.json();
        const form=ctx.$("#shareBoardForm");
        form.elements.symbol.value=info.symbol||symbol;
        form.elements.company_name.value=info.companyName||info.stockName||"";
        form.elements.exchange.value=info.exchange||"";
        form.elements.currency.value=info.currency||"USD";
        box.innerHTML="";
      });
    }catch(e){box.innerHTML='<div class="empty">股票查询失败</div>'}
  };

  ctx.$("#shareBoardForm").onsubmit=async e=>{
    e.preventDefault();const x=Object.fromEntries(new FormData(e.currentTarget).entries());
    const id=x.id||null;delete x.id;
    x.symbol=String(x.symbol||"").trim().toUpperCase();x.total_shares=Number(x.total_shares);x.remaining_shares=Number(x.remaining_shares);
    if(!Number.isFinite(x.total_shares)||x.total_shares<=0||!Number.isFinite(x.remaining_shares)||x.remaining_shares<0){ctx.toast("请输入有效份额",true);return}
    let info;
    try{const response=await fetch("/api/security-info?symbol="+encodeURIComponent(x.symbol));if(response.ok)info=matchingSecurity(x.symbol,await response.json())}catch{}
    if(!info||(info.companyName===x.symbol&&!validQuotePrice(info.price))){ctx.toast("无法验证股票信息，请查询有效股票后重试",true);return}
    x.company_name=info.companyName||info.stockName||x.symbol;x.stock_name=x.company_name;x.exchange=info.exchange||"";x.market=x.exchange;x.currency=info.currency||"USD";x.country=info.country||null;x.industry=info.industry||null;x.created_by=ctx.state.profile.id;x.updated_at=new Date().toISOString();
    if(x.remaining_shares>x.total_shares){ctx.toast("剩余份额不能大于总份额",true);return}
    let error;
    if(id)({error}=await ctx.supabase.from("share_boards").update(x).eq("id",id));
    else ({error}=await ctx.supabase.from("share_boards").insert(x));
    if(error){ctx.toast(error.message,true);return}
    ctx.closeModal();ctx.toast("份额看板已保存");await ctx.refreshAll();
  };

  ctx.$("#addSlotBtn").onclick=()=>{
    if(!ctx.state.shareBoard?.id){ctx.toast("请先保存股票份额看板",true);return}
    openSlotForm(ctx);
  };
}
function openSlotForm(ctx){
  ctx.modal("添加时段记录",`<form id="slotForm" class="formGrid">
    <div class="field"><label>罗马尼亚时间</label><input class="input" type="datetime-local" name="slot_at" value="${ctx.romaniaInputNow()}" required></div>
    <div class="field"><label>该时段预留份额</label><input class="input" type="number" min="0" step="0.0001" name="reserved_shares" required></div>
    <div class="field"><label>参与预留人数</label><input class="input" type="number" min="0" step="1" name="participant_count" required></div>
    <div class="field full"><button class="btn primary" type="submit">保存时段记录</button></div>
  </form>`);
  ctx.$("#slotForm").onsubmit=async e=>{
    e.preventDefault();
    const x=Object.fromEntries(new FormData(e.currentTarget).entries());
    const localValue=String(x.slot_at||"");
    const localDate=localValue.slice(0,10);
    const localMin=hhmmToMinutes(localValue.slice(11,16));
    const board=ctx.state.shareBoard;
    const settings=ctx.state.appSettings||{market_open_time:"09:30",target_trade_time:"14:30"};
    const openMin=hhmmToMinutes(settings.market_open_time),targetMin=hhmmToMinutes(settings.target_trade_time);
    const cap=Math.min(openMin,targetMin>0?targetMin:openMin);
    const today=ctx.romaniaDateKey(),nowMin=minutesOfRomania(Date.now());
    if(localDate!==String(board.board_date)){ctx.toast("时段记录日期必须与看板日期一致",true);return}
    if(localMin<360||localMin>cap){ctx.toast("时段记录必须位于有效业务时段内",true);return}
    if(localDate>today||(localDate===today&&localMin>nowMin)){ctx.toast("不能录入未来时段数据",true);return}
    x.board_id=board.id;
    x.slot_at=ctx.romaniaLocalToISO(localValue);
    x.reserved_shares=Number(x.reserved_shares);
    x.participant_count=Number(x.participant_count);
    const existing=(ctx.state.shareSlots||[]).filter(s=>s.board_id===board.id&&s.slot_at!==x.slot_at);
    const slotTotal=existing.reduce((sum,s)=>sum+Number(s.reserved_shares||0),0)+x.reserved_shares;
    const reservedTotal=Math.max(0,Number(board.total_shares||0)-Number(board.remaining_shares||0));
    if(slotTotal>reservedTotal+0.000001){ctx.toast("时段预留份额合计不能超过已预留份额",true);return}
    const {error}=await ctx.supabase.from("share_board_slots").upsert(x,{onConflict:"board_id,slot_at"});
    if(error){ctx.toast(error.message,true);return}
    ctx.closeModal();ctx.toast("时段记录已保存");await ctx.refreshAll();
  };
}

