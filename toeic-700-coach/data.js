// 課程資料：26 週，4 個階段 + 衝刺
// words: "單字|詞性|中文|例句"
// p5: [題目(___為空格), [選項A,B,C,D], 正解index, 中文解析]
// p2: [問句, [回應A,B,C], 正解index]
// talk: { title, role, turns: [[對方台詞, [可接受的回答...], 中文提示]] }

const PHASES = [
  { id: 1, name: "暖身期", en: "WARM UP", weeks: "1–6", target: 500, color: "yellow", desc: "辦公室、電話、餐廳的生活字彙，先把基本句型說順" },
  { id: 2, name: "升級期", en: "LEVEL UP", weeks: "7–12", target: 600, color: "pink", desc: "會議、Email、面試情境，時態一次搞懂，Part 2 反應變快" },
  { id: 3, name: "實戰期", en: "ACTION", weeks: "13–18", target: 680, color: "blue", desc: "行銷、財務、合約，被動與子句，Part 5 詞性題穩穩拿分" },
  { id: 4, name: "英雄期", en: "HERO", weeks: "19–24", target: 750, color: "green", desc: "IT、保險、財經新聞，進階文法和易混淆字全攻略" },
  { id: 5, name: "決戰期", en: "FINAL", weeks: "25–26", target: 750, color: "coral", desc: "全範圍複習、模擬考、錯題重練，帥氣上場" }
];

const WEEKS = [
// ===== Phase 1 =====
{ w: 1, phase: 1, theme: "自我介紹與辦公室", grammar: "be 動詞與現在簡單式",
  tip: "現在簡單式用於習慣與事實；第三人稱單數動詞加 -s（He works...）。",
  words: [
    "colleague|n.|同事|My colleague helps me with reports.",
    "department|n.|部門|She works in the sales department.",
    "manager|n.|經理|The manager is in a meeting.",
    "employee|n.|員工|The company has 200 employees.",
    "position|n.|職位|What position do you have?",
    "responsible|adj.|負責的|I am responsible for customer service.",
    "introduce|v.|介紹|Let me introduce myself.",
    "headquarters|n.|總部|Our headquarters is in Taipei.",
    "assistant|n.|助理|Please ask my assistant.",
    "schedule|n./v.|行程；安排|My schedule is full today."
  ],
  p5: [
    ["Ms. Chen ___ in the accounting department.", ["work","works","working","to work"], 1, "主詞 Ms. Chen 是第三人稱單數，現在簡單式動詞加 -s。"],
    ["The new employees ___ very friendly.", ["is","be","are","being"], 2, "主詞 employees 為複數，be 動詞用 are。"],
    ["Mr. Park is ___ for training new staff.", ["responsible","response","responsibly","responsibility"], 0, "be 動詞後接形容詞；be responsible for = 負責。"],
    ["Our ___ is located in Singapore.", ["headquarter","headquarters","headquartering","headquartered"], 1, "headquarters 恆以 -s 結尾，可當單數用。"],
    ["Let me ___ you to our team leader.", ["introduce","introduction","introducing","introduces"], 0, "let + 受詞 + 原形動詞。"]
  ],
  p2: [
    ["Which department do you work in?", ["In the marketing department.","Yes, I do.","It's on the table."], 0],
    ["Who is your manager?", ["At nine o'clock.","Ms. Lee is.","By email."], 1],
    ["Are you new here?", ["Yes, I started on Monday.","It's a new printer.","Here you are."], 0]
  ],
  talk: { title: "第一天上班", role: "你在新公司遇到同事 Amy",
    turns: [
      ["Hi, I'm Amy. Are you new here?", ["yes i am new here", "yes i just started today", "yes i'm new"], "回答：是的，我今天剛來"],
      ["Nice to meet you! Which department are you in?", ["i am in the sales department", "i work in the sales department", "i'm in sales"], "回答：我在業務部"],
      ["Great. What is your position?", ["i am a sales assistant", "i'm an assistant", "i am an assistant in sales"], "回答：我是業務助理"],
      ["Welcome to the team! Let me know if you need help.", ["thank you very much", "thanks a lot", "thank you that is very kind"], "道謝"]
    ] } },

{ w: 2, phase: 1, theme: "辦公用品與設備", grammar: "名詞單複數與冠詞 a / an / the",
  tip: "可數名詞單數前要有 a/an/the；不可數名詞（equipment, information）沒有複數。",
  words: [
    "equipment|n.|設備（不可數）|The office equipment is new.",
    "supplies|n.|用品|We need more office supplies.",
    "printer|n.|印表機|The printer is out of paper.",
    "copy|n./v.|複本；影印|Please make ten copies.",
    "document|n.|文件|Sign the document here.",
    "cabinet|n.|櫃子|The files are in the cabinet.",
    "repair|v./n.|修理|Someone will repair the copier.",
    "order|v./n.|訂購；訂單|I will order more paper.",
    "available|adj.|可用的；有空的|Is the meeting room available?",
    "replace|v.|更換|We should replace the old monitor."
  ],
  p5: [
    ["We need to buy new office ___.", ["equipment","equipments","an equipment","equipmenting"], 0, "equipment 為不可數名詞，不加 s、不加 a。"],
    ["Could you make ___ copy of this report?", ["a","an","some","many"], 0, "copy 是子音開頭的單數可數名詞，用 a。"],
    ["___ printer on the second floor is broken.", ["A","An","The","Some"], 2, "指特定那台（二樓的），用 the。"],
    ["The technician will ___ the copier tomorrow.", ["repair","repairs","repairing","repaired"], 0, "will 後接原形動詞。"],
    ["Is the conference room ___ this afternoon?", ["avail","available","availability","availably"], 1, "be 動詞後接形容詞 available。"]
  ],
  p2: [
    ["Where are the office supplies?", ["In the cabinet by the door.","Yes, I supplied them.","Tomorrow morning."], 0],
    ["Why isn't the printer working?", ["It's out of ink.","I work at the bank.","Print two copies."], 0],
    ["Should we order more paper?", ["Yes, we're almost out.","It's in order.","On paper."], 0]
  ],
  talk: { title: "印表機壞了", role: "你向行政 Tom 反映印表機問題",
    turns: [
      ["Hi, can I help you?", ["yes the printer is not working", "the printer is broken", "yes the printer isn't working"], "說：印表機壞了"],
      ["Oh no. What's the problem?", ["it is out of paper", "there is no paper", "it's out of ink"], "說：沒紙了／沒墨水了"],
      ["I see. I'll order more supplies today.", ["thank you when will they arrive", "great when will they come", "thanks when will it arrive"], "道謝並問何時會到"],
      ["They should arrive tomorrow morning.", ["okay thank you", "great thanks", "perfect thank you"], "回應"]
    ] } },

{ w: 3, phase: 1, theme: "電話與留言", grammar: "現在進行式 be + V-ing",
  tip: "表示正在發生或近期安排：She is talking on the phone. / I'm meeting him tomorrow.",
  words: [
    "call back|phr.|回電|Can you call me back later?",
    "message|n.|留言|May I take a message?",
    "extension|n.|分機|My extension is 205.",
    "available|adj.|有空接電話|She is not available right now.",
    "hold|v.|（電話）稍等|Please hold for a moment.",
    "connect|v.|轉接|I'll connect you to the manager.",
    "contact|v./n.|聯絡|Please contact me by email.",
    "urgent|adj.|緊急的|This is an urgent matter.",
    "regarding|prep.|關於|I'm calling regarding your order.",
    "inquiry|n.|詢問|We received your inquiry."
  ],
  p5: [
    ["Mr. Wang ___ on another line right now.", ["talk","is talking","talks","talked"], 1, "right now 表正在進行，用 be + V-ing。"],
    ["I'm calling ___ the job advertisement.", ["regarding","regard","regarded","regards"], 0, "regarding 當介系詞＝關於。"],
    ["Please ___ for a moment while I check.", ["hold","holding","holds","held"], 0, "祈使句用原形動詞。"],
    ["We are ___ a new client this afternoon.", ["meet","meets","meeting","met"], 2, "現在進行式可表近期確定安排。"],
    ["Thank you for your ___ about our services.", ["inquire","inquiry","inquiring","inquired"], 1, "your 後接名詞 inquiry。"]
  ],
  p2: [
    ["May I speak to Ms. Lopez?", ["I'm sorry, she's in a meeting.","Yes, she speaks English.","It's a speaker."], 0],
    ["Would you like to leave a message?", ["Yes, please ask him to call me back.","I left at five.","No, it's on the left."], 0],
    ["What's your extension number?", ["It's 312.","For three more days.","About the extension cord."], 0]
  ],
  talk: { title: "打電話找人", role: "你打電話到客戶公司找 Mr. Brown",
    turns: [
      ["Good morning, ABC Company. How can I help you?", ["may i speak to mr brown please", "can i speak to mr brown", "i would like to speak to mr brown"], "請求找 Mr. Brown"],
      ["I'm sorry, he's not available right now. May I take a message?", ["yes please ask him to call me back", "please ask him to call me back", "yes could you ask him to call me back"], "請他回電"],
      ["Sure. May I have your name and number?", ["my name is kayla my number is 0912345678", "this is kayla my number is 0912345678", "my name is kayla"], "說你的名字和電話"],
      ["Thank you. I'll give him the message.", ["thank you goodbye", "thanks have a nice day", "thank you bye"], "道謝道別"]
    ] } },

{ w: 4, phase: 1, theme: "時間與行程安排", grammar: "時間介系詞 at / on / in",
  tip: "at + 時刻（at 3 p.m.）；on + 日期星期（on Monday）；in + 月年季（in May）。by = 最晚在…之前；until = 持續到…。",
  words: [
    "appointment|n.|約會；預約|I have a dentist appointment at 3.",
    "reschedule|v.|重新安排時間|Can we reschedule the meeting?",
    "postpone|v.|延期|The event was postponed.",
    "deadline|n.|截止期限|The deadline is Friday.",
    "confirm|v.|確認|Please confirm your attendance.",
    "calendar|n.|行事曆|Check your calendar.",
    "convenient|adj.|方便的|Is Tuesday convenient for you?",
    "agenda|n.|議程|What's on the agenda?",
    "cancel|v.|取消|I need to cancel my booking.",
    "in advance|phr.|事先|Please book in advance."
  ],
  p5: [
    ["The meeting will start ___ 10 a.m.", ["in","on","at","by"], 2, "精確時刻用 at。"],
    ["The report must be submitted ___ Friday.", ["by","until","in","at"], 0, "by = 最晚在…之前完成。"],
    ["Our office is closed ___ Sundays.", ["in","on","at","for"], 1, "星期用 on。"],
    ["Would Thursday be ___ for you?", ["convenience","convenient","conveniently","convene"], 1, "be 動詞後接形容詞。"],
    ["The concert has been ___ until next month.", ["postponed","postpone","postponing","postpones"], 0, "has been + p.p. 被動，演唱會被延期。"]
  ],
  p2: [
    ["When is the deadline for the project?", ["Next Wednesday.","In the project room.","Mr. Kim did."], 0],
    ["Can we reschedule our meeting?", ["Sure, how about Thursday?","It was a great meeting.","On the schedule board."], 0],
    ["What time does the seminar begin?", ["At two thirty.","In the seminar room.","About marketing."], 0]
  ],
  talk: { title: "改約時間", role: "你需要跟客戶 Linda 改會議時間",
    turns: [
      ["Hi, this is Linda. What can I do for you?", ["i need to reschedule our meeting", "can we reschedule our meeting", "i would like to reschedule our meeting"], "說：需要改會議時間"],
      ["No problem. When is convenient for you?", ["how about thursday afternoon", "is thursday at two okay", "thursday afternoon is good for me"], "提議週四下午"],
      ["Thursday at 2 p.m. works for me.", ["great i will send you a calendar invite", "perfect i'll send an invitation", "great thank you"], "說會寄邀請"],
      ["Thanks. See you on Thursday.", ["see you then", "see you on thursday", "thank you see you"], "回應"]
    ] } },

{ w: 5, phase: 1, theme: "餐廳與訂位", grammar: "禮貌請求 Could / Would / May",
  tip: "Could you...? Would you like...? I'd like... 是 TOEIC 最常見的禮貌句型。",
  words: [
    "reservation|n.|預約|I'd like to make a reservation.",
    "menu|n.|菜單|Could I see the menu?",
    "recommend|v.|推薦|What do you recommend?",
    "bill|n.|帳單|Could we have the bill, please?",
    "serve|v.|供應；服務|They serve lunch until 2 p.m.",
    "cuisine|n.|料理|I love Italian cuisine.",
    "beverage|n.|飲料|Beverages are not included.",
    "catering|n.|外燴|The catering company brought food.",
    "dessert|n.|甜點|Would you like some dessert?",
    "party|n.|一行人；派對|A party of four, please."
  ],
  p5: [
    ["___ you like something to drink?", ["Do","Would","Are","Will"], 1, "Would you like...? 禮貌詢問。"],
    ["I'd like to ___ a table for two.", ["reserve","reservation","reserved","reserving"], 0, "would like to + 原形動詞。"],
    ["The chef ___ fresh seafood every day.", ["serve","serves","serving","to serve"], 1, "第三人稱單數加 s。"],
    ["Could you ___ a good restaurant nearby?", ["recommend","recommendation","recommended","recommends"], 0, "could + 原形動詞。"],
    ["Drinks are not ___ in the price.", ["include","included","including","includes"], 1, "be + p.p. 被動：被包含。"]
  ],
  p2: [
    ["Do you have a reservation?", ["Yes, under the name Lin.","I'd like the fish.","No, it's reserved for later."], 0],
    ["What do you recommend?", ["The steak is very popular.","Yes, I recommend it.","At seven o'clock."], 0],
    ["Could we have the bill, please?", ["Of course, I'll bring it right away.","He paid the bills.","It's a dollar bill."], 0]
  ],
  talk: { title: "餐廳訂位", role: "你打電話給餐廳訂位",
    turns: [
      ["Good evening, Bella Restaurant.", ["hi i would like to make a reservation", "i'd like to make a reservation", "i want to book a table"], "說：想訂位"],
      ["Certainly. For how many people?", ["for four people", "a party of four", "four people please"], "四位"],
      ["And what time would you like?", ["seven o'clock on friday", "at seven pm", "seven pm please"], "週五七點"],
      ["May I have your name, please?", ["it's lin", "my name is lin", "under the name lin"], "報名字"]
    ] } },

{ w: 6, phase: 1, theme: "購物與付款", grammar: "比較級與最高級",
  tip: "短字加 -er/-est（cheaper, cheapest），長字用 more/most（more expensive）。than 是比較級信號。",
  words: [
    "discount|n.|折扣|We offer a 20% discount.",
    "receipt|n.|收據|Keep your receipt.",
    "refund|n./v.|退款|Can I get a refund?",
    "exchange|v./n.|換貨|I'd like to exchange this shirt.",
    "purchase|v./n.|購買|Thank you for your purchase.",
    "customer|n.|顧客|The customer is always right.",
    "affordable|adj.|價格合理的|These shoes are affordable.",
    "warranty|n.|保固|It has a two-year warranty.",
    "in stock|phr.|有現貨|Is this item in stock?",
    "checkout|n.|結帳處|Please pay at the checkout."
  ],
  p5: [
    ["This model is ___ than the old one.", ["cheap","cheaper","cheapest","more cheap"], 1, "than 前用比較級。"],
    ["It is the ___ expensive laptop in the store.", ["more","most","much","many"], 1, "the + most + 長形容詞 = 最高級。"],
    ["Please keep your ___ for returns.", ["receive","receipt","receiving","received"], 1, "your 後接名詞 receipt。"],
    ["Customers can ___ items within 30 days.", ["exchange","exchanging","exchanged","to exchange"], 0, "助動詞 can + 原形。"],
    ["The jacket is not ___ stock at the moment.", ["on","at","in","for"], 2, "in stock 有現貨。"]
  ],
  p2: [
    ["Can I pay by credit card?", ["Yes, we accept all major cards.","It costs ten dollars.","At the bank."], 0],
    ["Is this item on sale?", ["Yes, it's 30 percent off.","I sold it yesterday.","It's on the shelf."], 0],
    ["Why are you returning the shoes?", ["They're too small.","I'll return at five.","Yes, please."], 0]
  ],
  talk: { title: "退換貨", role: "你到店裡想換一件襯衫",
    turns: [
      ["Hello, how can I help you today?", ["i would like to exchange this shirt", "i'd like to exchange this shirt", "can i exchange this shirt"], "想換這件襯衫"],
      ["Sure. What's wrong with it?", ["it is too small", "it's too small", "it doesn't fit"], "太小"],
      ["Do you have the receipt?", ["yes here it is", "yes here you are", "yes i do"], "有，給你"],
      ["Thank you. Here's a larger size.", ["thank you very much", "great thanks", "perfect thank you"], "道謝"]
    ] } },

// ===== Phase 2 =====
{ w: 7, phase: 2, theme: "交通與通勤", grammar: "過去簡單式",
  tip: "規則動詞加 -ed；不規則要背（go→went, take→took, leave→left）。yesterday / last / ago 是信號字。",
  words: [
    "commute|v./n.|通勤|My commute takes an hour.",
    "delay|n./v.|延誤|The train was delayed.",
    "fare|n.|車資|The bus fare is two dollars.",
    "platform|n.|月台|The train leaves from platform 3.",
    "traffic|n.|交通|Traffic was heavy this morning.",
    "route|n.|路線|Take the fastest route.",
    "passenger|n.|乘客|Passengers must wear seat belts.",
    "vehicle|n.|車輛|Park your vehicle here.",
    "transfer|v.|轉乘|Transfer at Central Station.",
    "construction|n.|施工|The road is under construction."
  ],
  p5: [
    ["The train ___ 20 minutes late yesterday.", ["arrive","arrives","arrived","arriving"], 2, "yesterday → 過去式。"],
    ["I ___ the bus to work last Monday.", ["take","took","taken","taking"], 1, "take 的過去式 took。"],
    ["The flight was ___ because of bad weather.", ["delay","delays","delayed","delaying"], 2, "was + p.p. 被動。"],
    ["Main Street is closed due to road ___.", ["construct","construction","constructive","constructed"], 1, "road construction 名詞片語。"],
    ["All ___ must show their tickets.", ["passenger","passengers","passenger's","passage"], 1, "All 後接複數名詞。"]
  ],
  p2: [
    ["How do you usually get to work?", ["I take the subway.","It's about work.","Yes, I usually do."], 0],
    ["Why was the train late?", ["There was a signal problem.","At platform two.","I'll train them."], 0],
    ["Which platform does the express leave from?", ["Platform five.","It left early.","A round-trip ticket."], 0]
  ],
  talk: { title: "問路搭車", role: "你在車站問站務員",
    turns: [
      ["Hi, do you need some help?", ["yes how do i get to the airport", "yes which train goes to the airport", "how can i get to the airport"], "問怎麼去機場"],
      ["Take the express train from platform 3.", ["how much is the fare", "how much is a ticket", "what is the fare"], "問車資"],
      ["It's 150 dollars. The next train leaves in 10 minutes.", ["thank you where can i buy a ticket", "thanks where is the ticket machine", "where can i buy a ticket"], "問哪裡買票"],
      ["The ticket machine is over there.", ["thank you so much", "thanks for your help", "great thank you"], "道謝"]
    ] } },

{ w: 8, phase: 2, theme: "旅遊與飯店", grammar: "未來式 will / be going to",
  tip: "will 表臨時決定或預測；be going to 表已計畫好的事。TOEIC 常見 will + 原形。",
  words: [
    "itinerary|n.|行程表|Here is your travel itinerary.",
    "accommodation|n.|住宿|Accommodation is included.",
    "check in|phr.|入住|You can check in after 3 p.m.",
    "luggage|n.|行李（不可數）|Please leave your luggage here.",
    "destination|n.|目的地|What's your final destination?",
    "departure|n.|出發|The departure time is 8 a.m.",
    "amenities|n.|設施|The hotel has great amenities.",
    "upgrade|v./n.|升級|We can upgrade your room.",
    "boarding pass|n.|登機證|Show your boarding pass.",
    "complimentary|adj.|免費贈送的|Breakfast is complimentary."
  ],
  p5: [
    ["The tour group ___ leave at 8 a.m. tomorrow.", ["will","was","did","has"], 0, "tomorrow → 未來式 will。"],
    ["Guests can store their ___ at the front desk.", ["luggage","luggages","a luggage","luggaging"], 0, "luggage 不可數。"],
    ["Breakfast is ___ for all hotel guests.", ["compliment","complimentary","complimenting","complimented"], 1, "be 動詞後接形容詞 complimentary（免費的）。"],
    ["We are going ___ Tokyo next month.", ["visit","visiting","to visit","visited"], 2, "be going to + 原形。"],
    ["Please arrive two hours before ___.", ["depart","departure","departed","departing"], 1, "介系詞 before 後可接名詞 departure。"]
  ],
  p2: [
    ["What time is check-out?", ["By eleven a.m.","I checked it.","Room 402."], 0],
    ["Is breakfast included?", ["Yes, it's served from 7 to 10.","She included me.","I'd like eggs."], 0],
    ["Would you like a window or aisle seat?", ["A window seat, please.","I'd like to see it.","Yes, I would."], 0]
  ],
  talk: { title: "飯店入住", role: "你在飯店櫃台辦入住",
    turns: [
      ["Good afternoon. Welcome to the Grand Hotel.", ["hi i have a reservation under lin", "i'd like to check in please", "hello i want to check in"], "說要入住／有訂房"],
      ["Yes, Ms. Lin. Three nights, correct?", ["yes that's right", "yes that is correct", "yes three nights"], "確認"],
      ["Here's your key. Breakfast is complimentary.", ["what time is breakfast", "when is breakfast served", "where is breakfast"], "問早餐時間"],
      ["From 7 to 10 on the second floor.", ["thank you very much", "great thanks", "thanks a lot"], "道謝"]
    ] } },

{ w: 9, phase: 2, theme: "會議", grammar: "詞性判斷：名詞／形容詞／副詞",
  tip: "Part 5 最大宗！冠詞/所有格後接名詞；be 動詞後接形容詞；修飾動詞用副詞（-ly）。字尾：-tion/-ment 名詞、-ive/-ful/-able 形容詞、-ly 副詞。",
  words: [
    "attend|v.|出席|Ten people attended the meeting.",
    "participant|n.|參與者|All participants received a handout.",
    "proposal|n.|提案|We reviewed the proposal.",
    "discuss|v.|討論|Let's discuss the budget.",
    "minutes|n.|會議記錄|Who will take the minutes?",
    "presentation|n.|簡報|Her presentation was clear.",
    "effective|adj.|有效的|We need an effective plan.",
    "decision|n.|決定|We made a final decision.",
    "brief|adj.|簡短的|Let's have a brief meeting.",
    "summarize|v.|總結|Can you summarize the main points?"
  ],
  p5: [
    ["The ___ was very informative.", ["present","presentation","presented","presentable"], 1, "冠詞 the 後接名詞。"],
    ["Ms. Diaz spoke ___ about the new policy.", ["clear","clearly","clearness","clearer"], 1, "修飾動詞 spoke 用副詞。"],
    ["This is a very ___ strategy.", ["effect","effective","effectively","effectiveness"], 1, "名詞 strategy 前用形容詞。"],
    ["All ___ must register before the meeting.", ["participate","participants","participation","participated"], 1, "All 後接複數名詞（人）。"],
    ["We need to make a ___ by Friday.", ["decide","decisive","decision","decided"], 2, "冠詞 a 後接名詞。"]
  ],
  p2: [
    ["Who's going to take the minutes?", ["Jenny volunteered.","About thirty minutes.","Yes, take it."], 0],
    ["Did you attend the budget meeting?", ["No, I was out of the office.","It's on the budget.","She'll attend to it."], 0],
    ["Shall we start the meeting now?", ["Let's wait for Mr. Ford.","It started yesterday.","In the meeting room."], 0]
  ],
  talk: { title: "會議發言", role: "你在部門會議被主管點名",
    turns: [
      ["Let's begin. Can you summarize last week's sales?", ["sales increased by ten percent", "our sales went up ten percent", "sales were up ten percent"], "業績成長 10%"],
      ["Good. What do you think caused the increase?", ["i think the new advertising was effective", "the new ad campaign was effective", "i think our promotion worked"], "認為新廣告很有效"],
      ["Do you have any proposals for next month?", ["i suggest we offer a discount", "i propose a special discount", "we should offer a discount"], "建議推出折扣"],
      ["Interesting. Please send me the details.", ["sure i will email you today", "of course i'll send them today", "okay i will"], "說今天寄信"]
    ] } },

{ w: 10, phase: 2, theme: "Email 與商業書信", grammar: "人稱代名詞與所有格",
  tip: "主格 I/he/they、受格 me/him/them、所有格 my/his/their、所有代名詞 mine/his/theirs、反身 myself。看空格位置決定。",
  words: [
    "attach|v.|附加|I have attached the file.",
    "forward|v.|轉寄|Please forward this email to Tom.",
    "reply|v./n.|回覆|Thank you for your quick reply.",
    "regards|n.|問候（結尾）|Best regards, Kayla",
    "notify|v.|通知|We will notify you by email.",
    "enclose|v.|隨函附上|Please find the enclosed invoice.",
    "request|n./v.|要求|We received your request.",
    "sincerely|adv.|誠摯地|Sincerely yours,",
    "recipient|n.|收件人|Check the recipient's address.",
    "correspondence|n.|往來信件|Keep all correspondence."
  ],
  p5: [
    ["Please send ___ the updated file.", ["I","me","my","mine"], 1, "動詞後接受格 me。"],
    ["Ms. Kim finished the report by ___.", ["she","her","hers","herself"], 3, "by oneself = 獨自，用反身代名詞。"],
    ["The clients reviewed ___ contract carefully.", ["they","them","their","theirs"], 2, "名詞前用所有格 their。"],
    ["I have ___ the invoice to this email.", ["attach","attached","attaching","attaches"], 1, "have + p.p. 現在完成式。"],
    ["We will ___ you when the order ships.", ["notify","notice","notification","notified"], 0, "will + 原形動詞 notify。"]
  ],
  p2: [
    ["Did you get my email?", ["Yes, I'll reply this afternoon.","No, it's female.","At the post office."], 0],
    ["Could you forward me the schedule?", ["Sure, I'll send it now.","Go forward two blocks.","It was last week."], 0],
    ["Who is this letter addressed to?", ["The HR manager.","On Fifth Avenue.","It's a long letter."], 0]
  ],
  talk: { title: "口頭說明 Email", role: "主管問你是否寄出報價",
    turns: [
      ["Did you send the price quote to the client?", ["yes i sent it this morning", "yes i emailed it this morning", "yes i did this morning"], "說早上寄了"],
      ["Did you attach the product catalog too?", ["yes i attached it", "yes it is attached", "yes i included the catalog"], "說有附上"],
      ["Great. Has the client replied yet?", ["not yet i will follow up tomorrow", "no not yet", "not yet i'll call them tomorrow"], "還沒，明天追蹤"],
      ["Please forward their reply to me.", ["sure i will", "of course no problem", "okay i will forward it"], "答應"]
    ] } },

{ w: 11, phase: 2, theme: "人事與招募", grammar: "現在完成式 have + p.p.",
  tip: "表示從過去持續到現在或已完成的經驗。信號字：since, for, already, yet, recently, so far。",
  words: [
    "applicant|n.|應徵者|We interviewed five applicants.",
    "qualification|n.|資格|What are the qualifications?",
    "candidate|n.|候選人|She is the best candidate.",
    "hire|v.|雇用|We hired two engineers.",
    "résumé|n.|履歷|Please send your résumé.",
    "experience|n.|經驗|He has ten years of experience.",
    "promote|v.|升遷；促銷|She was promoted to manager.",
    "benefit|n.|福利|The job offers good benefits.",
    "recruit|v.|招募|We are recruiting new staff.",
    "personnel|n.|人事；全體員工|Contact the personnel office."
  ],
  p5: [
    ["Mr. Lee ___ at this company since 2015.", ["works","worked","has worked","working"], 2, "since → 現在完成式。"],
    ["We have ___ received over 100 applications.", ["yet","already","since","ago"], 1, "肯定句用 already。"],
    ["All ___ must submit a cover letter.", ["apply","applicants","applied","application"], 1, "主詞需要人的複數名詞。"],
    ["She was ___ to senior manager last year.", ["promote","promoted","promotion","promoting"], 1, "was + p.p. 被動。"],
    ["The position requires five years of ___.", ["experience","experienced","experiencing","experiences"], 0, "years of experience 固定用法。"]
  ],
  p2: [
    ["Have you hired a new assistant yet?", ["Not yet, we're still interviewing.","Higher than last year.","Yes, I assisted him."], 0],
    ["How many applicants are there?", ["About fifty so far.","Apply online.","Yes, there are."], 0],
    ["What are the job requirements?", ["A degree and two years' experience.","I required it.","Next Monday."], 0]
  ],
  talk: { title: "電話面試預約", role: "人資 Sarah 打給你安排面試",
    turns: [
      ["Hello, this is Sarah from Bright Tech. We received your résumé.", ["thank you for calling", "hi sarah thank you for calling", "thank you i am glad to hear that"], "謝謝來電"],
      ["We'd like to invite you for an interview.", ["that's great when is it", "great when would you like to meet", "wonderful what time"], "問時間"],
      ["How about next Monday at 10 a.m.?", ["monday at ten works for me", "that's fine with me", "yes that is perfect"], "答應"],
      ["Please bring a copy of your certificates.", ["okay i will bring them", "sure no problem", "of course thank you"], "答應攜帶"]
    ] } },

{ w: 12, phase: 2, theme: "面試與職涯", grammar: "動名詞 V-ing vs. 不定詞 to V",
  tip: "enjoy/finish/avoid/consider + V-ing；want/plan/decide/hope/agree + to V。介系詞後一律 V-ing（look forward to meeting）。",
  words: [
    "strength|n.|優點|What are your strengths?",
    "goal|n.|目標|My goal is to become a manager.",
    "achieve|v.|達成|We achieved our sales target.",
    "skill|n.|技能|She has strong communication skills.",
    "motivated|adj.|積極的|I am a highly motivated person.",
    "challenge|n.|挑戰|I enjoy new challenges.",
    "career|n.|職涯|I want to build my career here.",
    "salary|n.|薪水|The salary is negotiable.",
    "previous|adj.|先前的|In my previous job, I led a team.",
    "look forward to|phr.|期待|I look forward to hearing from you."
  ],
  p5: [
    ["I look forward to ___ from you.", ["hear","hearing","heard","to hear"], 1, "look forward to 的 to 是介系詞，後接 V-ing。"],
    ["She decided ___ the job offer.", ["accept","accepting","to accept","accepted"], 2, "decide + to V。"],
    ["He enjoys ___ with international clients.", ["work","working","to work","worked"], 1, "enjoy + V-ing。"],
    ["In my ___ position, I managed a team of five.", ["previous","previously","prevent","previewed"], 0, "名詞前用形容詞。"],
    ["We plan ___ a new branch next year.", ["open","opening","to open","opened"], 2, "plan + to V。"]
  ],
  p2: [
    ["Why do you want to work here?", ["I admire your company's mission.","Here is fine.","I worked late."], 0],
    ["What is your greatest strength?", ["I'm good at solving problems.","It's very strong.","About five years."], 0],
    ["When can you start?", ["In two weeks.","It started at nine.","Yes, I can."], 0]
  ],
  talk: { title: "英文面試", role: "面試官問你基本問題",
    turns: [
      ["Can you tell me a little about yourself?", ["i have three years of experience in sales", "i have worked in recycling for ten years", "i am a motivated and hardworking person"], "說工作經驗"],
      ["What is your greatest strength?", ["i am good at communicating with customers", "i am good at solving problems", "my strength is teamwork"], "說優點"],
      ["Why do you want to work here?", ["i want to grow my career with your company", "i like your company's mission", "i want to learn new skills here"], "說動機"],
      ["Thank you. We will contact you next week.", ["thank you i look forward to hearing from you", "thank you for your time", "thank you very much"], "感謝並表期待"]
    ] } },

// ===== Phase 3 =====
{ w: 13, phase: 3, theme: "行銷與廣告", grammar: "被動語態 be + p.p.",
  tip: "主詞是「被」動作的對象時用被動。TOEIC 常考：The product was launched... / will be held...",
  words: [
    "launch|v./n.|推出|The product will be launched in May.",
    "campaign|n.|活動|The ad campaign was successful.",
    "advertise|v.|廣告|We advertise on social media.",
    "target|n./v.|目標|Our target market is young adults.",
    "survey|n.|調查|We conducted a customer survey.",
    "brand|n.|品牌|The brand is well known.",
    "promotion|n.|促銷|The summer promotion starts today.",
    "competitor|n.|競爭者|Our competitor lowered prices.",
    "feedback|n.|回饋|Customer feedback was positive.",
    "strategy|n.|策略|We need a new marketing strategy."
  ],
  p5: [
    ["The new smartphone will ___ next month.", ["launch","be launched","launching","launches"], 1, "產品「被推出」用被動 will be + p.p.。"],
    ["The survey was ___ by an outside agency.", ["conduct","conducted","conducting","conducts"], 1, "was + p.p.。"],
    ["Our ___ reduced their prices last week.", ["compete","competitive","competitors","competition"], 2, "主詞需人/公司名詞，且後面用 their → 複數。"],
    ["The results of the campaign were very ___.", ["success","succeed","successful","successfully"], 2, "be 動詞後接形容詞。"],
    ["Customer ___ helps us improve our products.", ["feedback","feedbacks","feeding","fed"], 0, "feedback 不可數。"]
  ],
  p2: [
    ["When will the ad campaign start?", ["At the beginning of next month.","On television.","It was a great ad."], 0],
    ["Who designed the new logo?", ["An agency in Seoul.","It's designed for kids.","Yes, he signed it."], 0],
    ["Did the survey results come in?", ["Yes, they're on my desk.","Come in, please.","I surveyed the room."], 0]
  ],
  talk: { title: "行銷提案", role: "你向主管簡報新產品推廣",
    turns: [
      ["So, who is the target market for the new product?", ["our target market is young professionals", "it is people in their twenties and thirties", "young adults who care about the environment"], "說目標市場"],
      ["How will we advertise it?", ["we will advertise on social media", "mainly on social media and youtube", "through social media and online ads"], "說廣告管道"],
      ["What's the budget for the campaign?", ["about one million dollars", "around five hundred thousand dollars", "we need about one million"], "說預算"],
      ["Sounds good. When can we launch?", ["we can launch in september", "it will be launched next month", "in about two months"], "說上市時間"]
    ] } },

{ w: 14, phase: 3, theme: "銷售與客戶服務", grammar: "連接詞 although / because / despite",
  tip: "because / although + 子句（主詞+動詞）；because of / despite + 名詞。Part 5 必考！",
  words: [
    "client|n.|客戶|We met with an important client.",
    "satisfaction|n.|滿意度|Customer satisfaction is our priority.",
    "complaint|n.|抱怨|We received a complaint.",
    "resolve|v.|解決|We resolved the issue quickly.",
    "quote|n.|報價|Can you send me a quote?",
    "negotiate|v.|談判|We negotiated a better price.",
    "loyal|adj.|忠誠的|We have many loyal customers.",
    "representative|n.|代表|A sales representative will call you.",
    "inquire|v.|詢問|She inquired about the price.",
    "apologize|v.|道歉|We apologize for the inconvenience."
  ],
  p5: [
    ["___ the price was high, many customers bought it.", ["Despite","Although","Because of","However"], 1, "空格後是完整子句，且語意轉折 → Although。"],
    ["The event was canceled ___ the storm.", ["because","because of","although","despite"], 1, "後接名詞 the storm → because of。"],
    ["___ the delay, the project finished on budget.", ["Although","Despite","Because","Even"], 1, "後接名詞 + 轉折 → Despite。"],
    ["We ___ for any inconvenience this may cause.", ["apology","apologize","apologetic","apologizing"], 1, "主詞 We 後接動詞。"],
    ["Customer ___ has increased this year.", ["satisfy","satisfied","satisfaction","satisfying"], 2, "主詞位置需名詞。"]
  ],
  p2: [
    ["Could you send me a price quote?", ["I'll email it this afternoon.","It's a famous quote.","The price went up."], 0],
    ["Why is the customer upset?", ["His order arrived damaged.","He set it up.","Yes, he is."], 0],
    ["Who handles customer complaints?", ["The service desk does.","About ten a day.","I'm not complaining."], 0]
  ],
  talk: { title: "處理客訴", role: "你是客服，顧客打來抱怨",
    turns: [
      ["Hi, my order arrived damaged. I'm very upset.", ["i am very sorry to hear that", "i apologize for the problem", "i'm so sorry about that"], "道歉"],
      ["The box was broken and the cup inside was cracked.", ["may i have your order number", "can i have your order number please", "could you give me your order number"], "要訂單編號"],
      ["It's A12345.", ["we will send you a new one right away", "we will send a replacement today", "we can send you a new cup or a refund"], "提供換貨"],
      ["Okay, thank you for your help.", ["you're welcome we apologize for the inconvenience", "you're welcome have a nice day", "my pleasure sorry again"], "結尾致歉"]
    ] } },

{ w: 15, phase: 3, theme: "財務與會計", grammar: "關係代名詞 who / which / that / whose",
  tip: "先行詞是人用 who，物用 which，皆可用 that；表所有用 whose（whose + 名詞）。",
  words: [
    "budget|n.|預算|We are over budget.",
    "expense|n.|費用|Submit your travel expenses.",
    "invoice|n.|發票；請款單|Please pay the invoice by Friday.",
    "revenue|n.|營收|Revenue rose by 15 percent.",
    "profit|n.|利潤|The company made a large profit.",
    "reimburse|v.|報銷；退還|We will reimburse your costs.",
    "audit|n./v.|查帳|The annual audit is next week.",
    "estimate|n./v.|估計|Can you give me an estimate?",
    "fiscal|adj.|財政的|The fiscal year ends in December.",
    "account|n.|帳戶|Transfer the money to this account."
  ],
  p5: [
    ["The accountant ___ prepared the report is on vacation.", ["which","who","whose","whom"], 1, "先行詞是人，作主詞 → who。"],
    ["This is the invoice ___ arrived yesterday.", ["who","which","whose","where"], 1, "先行詞是物 → which。"],
    ["The client ___ account was closed called us.", ["who","which","whose","that"], 2, "後接名詞 account 表所有 → whose。"],
    ["Employees will be ___ for travel costs.", ["reimburse","reimbursed","reimbursement","reimbursing"], 1, "被報銷 → be + p.p.。"],
    ["Annual ___ increased by ten percent.", ["revenue","revenues","revenued","revenuing"], 0, "revenue 主詞名詞，常用單數。"]
  ],
  p2: [
    ["Have you submitted your expense report?", ["Yes, I sent it to accounting.","It's too expensive.","No, report it to me."], 0],
    ["Who approves the budget?", ["The finance director.","About a million.","Yes, I approve."], 0],
    ["When is the invoice due?", ["At the end of the month.","Do it again.","It's from our supplier."], 0]
  ],
  talk: { title: "報帳", role: "你向財務部 Kevin 詢問出差報帳",
    turns: [
      ["Hi, what can I do for you?", ["i would like to ask about travel expenses", "how do i get reimbursed for my trip", "i have a question about my expense report"], "問出差報帳"],
      ["Sure. Do you have all your receipts?", ["yes i have all of them", "yes here they are", "i have most of them"], "有收據"],
      ["Please fill out this form and attach the receipts.", ["when will i be reimbursed", "how long does it take", "when will i get the money"], "問何時撥款"],
      ["Usually within two weeks.", ["great thank you", "okay thanks for your help", "thank you very much"], "道謝"]
    ] } },

{ w: 16, phase: 3, theme: "採購與物流", grammar: "介系詞片語與固定搭配",
  tip: "常考：in charge of（負責）、according to（根據）、due to（由於）、in addition to（除了…還）、prior to（在…之前）。",
  words: [
    "supplier|n.|供應商|We changed our supplier.",
    "shipment|n.|貨運；貨物|The shipment arrived late.",
    "inventory|n.|庫存|Check the inventory levels.",
    "warehouse|n.|倉庫|The goods are in the warehouse.",
    "deliver|v.|運送|We deliver within three days.",
    "track|v.|追蹤|You can track your package online.",
    "bulk|n.|大量|We buy paper in bulk.",
    "procurement|n.|採購|She works in procurement.",
    "shortage|n.|短缺|There is a shortage of parts.",
    "estimated|adj.|預估的|The estimated delivery date is May 3."
  ],
  p5: [
    ["Mr. Ito is in charge ___ the warehouse.", ["for","of","with","to"], 1, "in charge of = 負責。"],
    ["The shipment was delayed ___ bad weather.", ["due to","because","although","since"], 0, "後接名詞 → due to。"],
    ["___ to the schedule, the goods will arrive Monday.", ["According","Due","Prior","Thanks"], 0, "according to the schedule = 根據行程。"],
    ["Please check the ___ before placing an order.", ["invent","inventory","inventive","inventing"], 1, "the 後接名詞。"],
    ["Orders placed ___ noon will ship the same day.", ["prior to","in spite of","instead of","because of"], 0, "prior to noon = 中午之前。"]
  ],
  p2: [
    ["Has the shipment from Germany arrived?", ["It's expected tomorrow.","Yes, it's a ship.","He's from Germany."], 0],
    ["Where should I put these boxes?", ["In the storage room, please.","They're heavy boxes.","I put it on."], 0],
    ["Can I track my order online?", ["Yes, use the tracking number.","Run on the track.","I ordered fish."], 0]
  ],
  talk: { title: "催貨", role: "你打給供應商詢問延遲的貨",
    turns: [
      ["Hello, Delta Supply. How may I help you?", ["i am calling about our order", "i'm calling regarding a late shipment", "our shipment hasn't arrived yet"], "說來電詢問訂單"],
      ["Let me check. It was delayed due to a shortage of parts.", ["when will it be delivered", "when can we expect it", "what is the new delivery date"], "問何時能送到"],
      ["The estimated delivery date is next Wednesday.", ["can you deliver it sooner", "is it possible to ship it earlier", "we need it by monday"], "要求提早"],
      ["I'll see what I can do and call you back.", ["thank you i appreciate it", "thanks please let me know", "great thank you"], "道謝"]
    ] } },

{ w: 17, phase: 3, theme: "製造與品質管理", grammar: "副詞的位置與種類",
  tip: "副詞修飾動詞、形容詞、整句。常考位置：be + ___ + p.p.（is carefully inspected）、have + ___ + p.p.。",
  words: [
    "manufacture|v.|製造|We manufacture auto parts.",
    "factory|n.|工廠|The factory operates 24 hours.",
    "inspect|v.|檢查|All products are inspected.",
    "defect|n.|瑕疵|We found a defect.",
    "efficient|adj.|有效率的|The new machine is more efficient.",
    "assemble|v.|組裝|Workers assemble the parts.",
    "standard|n.|標準|We meet safety standards.",
    "productivity|n.|生產力|Productivity increased by 20%.",
    "operate|v.|操作；運作|Only trained staff can operate it.",
    "maintenance|n.|維修保養|The machine needs regular maintenance."
  ],
  p5: [
    ["Every product is ___ inspected before shipping.", ["careful","carefully","care","caring"], 1, "be 與 p.p. 之間放副詞。"],
    ["The new system works very ___.", ["efficient","efficiently","efficiency","efficiencies"], 1, "修飾動詞 works 用副詞。"],
    ["Regular ___ prevents machine breakdowns.", ["maintain","maintenance","maintained","maintaining"], 1, "主詞位置需名詞。"],
    ["The workers have ___ completed the order.", ["successful","success","successfully","succeed"], 2, "have 與 p.p. 之間用副詞。"],
    ["Our products meet international safety ___.", ["standard","standards","standardize","standardly"], 1, "meet standards 符合標準（複數）。"]
  ],
  p2: [
    ["Why did the production line stop?", ["A machine broke down.","It's in line.","Yes, it's produced here."], 0],
    ["How often is the equipment inspected?", ["Once a month.","By a specialist.","I expected it."], 0],
    ["Who's responsible for quality control?", ["Ms. Rivera's team.","It's high quality.","At the factory."], 0]
  ],
  talk: { title: "工廠參觀", role: "你帶外國客戶參觀回收廠",
    turns: [
      ["Thank you for showing me around. What do you produce here?", ["we recycle plastic into new materials", "we manufacture recycled plastic pellets", "we process recycled materials"], "介紹產品"],
      ["How do you check quality?", ["every batch is carefully inspected", "we inspect every product before shipping", "we test samples every day"], "說明品管"],
      ["How many workers are there?", ["about fifty workers", "we have around fifty employees", "there are fifty people"], "員工數"],
      ["Very impressive. It looks very efficient.", ["thank you we work hard to improve", "thank you we are proud of it", "thanks we try our best"], "回應稱讚"]
    ] } },

{ w: 18, phase: 3, theme: "合約與談判", grammar: "條件句 if / unless",
  tip: "If + 現在式, will + 原形（真實條件）。unless = if not。TOEIC 也常考 provided that / as long as。",
  words: [
    "contract|n.|合約|Please sign the contract.",
    "terms|n.|條款|We agreed on the terms.",
    "agreement|n.|協議|We reached an agreement.",
    "renew|v.|續約|We will renew the contract.",
    "expire|v.|到期|The contract expires in June.",
    "clause|n.|條款|Read this clause carefully.",
    "mutual|adj.|雙方的|It's a mutual benefit.",
    "compromise|n./v.|妥協|We reached a compromise.",
    "obligation|n.|義務|We have no obligation to pay.",
    "valid|adj.|有效的|The offer is valid until May."
  ],
  p5: [
    ["If the client ___ the terms, we will sign tomorrow.", ["accept","accepts","accepted","will accept"], 1, "if 子句用現在式代替未來。"],
    ["The offer is not valid ___ you register by Friday.", ["if","unless","because","so"], 1, "unless = 除非。"],
    ["Our contract will ___ at the end of the year.", ["expire","expired","expiration","expiring"], 0, "will + 原形。"],
    ["Both parties reached a ___ agreement.", ["mutual","mutually","mutuality","mutualize"], 0, "名詞前用形容詞。"],
    ["We will deliver on time ___ that the payment is made.", ["provided","provide","providing to","provision"], 0, "provided that = 只要；假如。"]
  ],
  p2: [
    ["When does our contract expire?", ["At the end of June.","It's very expensive.","He signed it."], 0],
    ["Can we lower the price a little?", ["Only if you order more units.","The prices are on the list.","It's a little late."], 0],
    ["Have they signed the agreement?", ["Not yet, they're reviewing it.","Yes, it's a sign.","I agree."], 0]
  ],
  talk: { title: "價格談判", role: "你和買家談價格",
    turns: [
      ["Your price is a little high for us.", ["if you order more we can offer a discount", "we can lower the price if you order more", "what quantity are you thinking of"], "提出量大可折扣"],
      ["We could order 10,000 units.", ["then we can offer a five percent discount", "in that case we can give you five percent off", "we can offer five percent off"], "給 5% 折扣"],
      ["Can you also offer free shipping?", ["yes if you pay within thirty days", "we can do that if you sign a one year contract", "free shipping is possible for that amount"], "有條件同意"],
      ["Great, I think we have a deal.", ["great i will send you the contract", "wonderful i'll prepare the contract", "excellent thank you"], "說會寄合約"]
    ] } },

// ===== Phase 4 =====
{ w: 19, phase: 4, theme: "科技與 IT", grammar: "分詞形容詞 -ing / -ed",
  tip: "-ing 表「令人…的」（事物性質）；-ed 表「感到…的」（人的感受）。interesting / interested、confusing / confused。",
  words: [
    "software|n.|軟體|Install the latest software.",
    "update|n./v.|更新|The system update takes ten minutes.",
    "device|n.|裝置|Turn off all electronic devices.",
    "password|n.|密碼|Change your password regularly.",
    "access|n./v.|使用權；存取|You need permission to access the file.",
    "technical|adj.|技術的|We have a technical problem.",
    "install|v.|安裝|IT will install the program.",
    "database|n.|資料庫|The customer database was updated.",
    "malfunction|n./v.|故障|The server malfunctioned.",
    "compatible|adj.|相容的|Is it compatible with Mac?"
  ],
  p5: [
    ["The new software instructions were ___.", ["confused","confusing","confuse","confusion"], 1, "事物「令人困惑的」用 -ing。"],
    ["The staff were ___ in the new system.", ["interesting","interested","interest","interestingly"], 1, "人「感到興趣」用 -ed。"],
    ["Employees can ___ the database from home.", ["access","accessible","accessing","accessed"], 0, "can + 原形。"],
    ["This printer is not ___ with older computers.", ["compatible","compatibly","compatibility","compete"], 0, "be + 形容詞；be compatible with。"],
    ["The ___ team will fix the problem.", ["technique","technical","technically","technician"], 1, "名詞 team 前用形容詞。"]
  ],
  p2: [
    ["My computer won't turn on.", ["Have you called IT support?","Turn left at the corner.","It's a new computer."], 0],
    ["When will the system update be finished?", ["In about an hour.","It's up to date.","On the system."], 0],
    ["Do you know the Wi-Fi password?", ["It's on the board by the door.","I passed the test.","Yes, it's wide."], 0]
  ],
  talk: { title: "IT 求助", role: "你打給 IT 部門說電腦有問題",
    turns: [
      ["IT support, this is Mike.", ["hi my computer is not working", "hi i have a problem with my computer", "my laptop won't turn on"], "說電腦有問題"],
      ["What exactly is happening?", ["it keeps freezing", "the screen is black", "i can't access my email"], "描述狀況"],
      ["Have you tried restarting it?", ["yes but it didn't help", "yes twice but nothing changed", "yes i already tried that"], "說試過沒用"],
      ["OK, I'll come to your desk in ten minutes.", ["thank you i'm on the third floor", "great thanks a lot", "thank you see you soon"], "道謝並說樓層"]
    ] } },

{ w: 20, phase: 4, theme: "房地產與辦公設施", grammar: "主詞與動詞一致",
  tip: "主詞後若有長修飾語（介系詞片語、關係子句），要找出真正主詞。each / every / one of + 複數 → 動詞用單數。",
  words: [
    "lease|n./v.|租約；租賃|We signed a two-year lease.",
    "tenant|n.|房客|The tenants complained about noise.",
    "property|n.|房產|The property is near the station.",
    "renovate|v.|翻新|The lobby is being renovated.",
    "spacious|adj.|寬敞的|The office is bright and spacious.",
    "facility|n.|設施|The facility includes a gym.",
    "relocate|v.|搬遷|We are relocating to a new office.",
    "utility|n.|水電瓦斯|Utilities are included in the rent.",
    "landlord|n.|房東|Call the landlord about the leak.",
    "occupy|v.|佔用|The building is fully occupied."
  ],
  p5: [
    ["The list of new tenants ___ on the board.", ["are","is","were","be"], 1, "真正主詞是 the list（單數）。"],
    ["Each of the offices ___ a window.", ["have","has","having","are"], 1, "Each of + 複數 → 單數動詞。"],
    ["The lobby is currently being ___.", ["renovate","renovated","renovation","renovating"], 1, "being + p.p. 進行被動。"],
    ["The company plans to ___ to Taichung.", ["relocate","relocation","relocated","relocating"], 0, "plan to + 原形。"],
    ["Rent includes all ___ except internet.", ["utility","utilities","utilize","utilized"], 1, "all 後接複數名詞。"]
  ],
  p2: [
    ["When does the lease expire?", ["Next March.","Please release it.","At least two."], 0],
    ["Is the office building near the station?", ["Yes, it's a five-minute walk.","It's an old building.","He stationed there."], 0],
    ["Who should I call about the broken heater?", ["The building manager.","It's very hot.","Call me Ben."], 0]
  ],
  talk: { title: "看辦公室", role: "你和仲介看新辦公室",
    turns: [
      ["This is the office space. What do you think?", ["it is very bright and spacious", "it's bigger than i expected", "i like it it's very spacious"], "給評價"],
      ["The rent is 80,000 dollars a month.", ["are utilities included", "does that include utilities", "is parking included"], "問是否含水電"],
      ["Utilities are included, but parking is extra.", ["how long is the lease", "what is the minimum lease", "can we sign a one year lease"], "問租期"],
      ["The minimum lease is two years.", ["let me discuss it with my manager", "i will talk to my boss and call you", "okay i will think about it"], "說要回去討論"]
    ] } },

{ w: 21, phase: 4, theme: "健康與保險", grammar: "假設語氣（與現在事實相反）",
  tip: "If + 過去式（be 用 were）, would/could + 原形。例：If I were you, I would see a doctor. 另：It is important that he (should) be...（原形）。",
  words: [
    "insurance|n.|保險|Does your insurance cover this?",
    "coverage|n.|保險範圍|The policy offers full coverage.",
    "prescription|n.|處方|Take this prescription to the pharmacy.",
    "symptom|n.|症狀|What are your symptoms?",
    "claim|n./v.|索賠；聲稱|I filed an insurance claim.",
    "premium|n.|保費|The monthly premium is high.",
    "patient|n.|病人|The patient is waiting.",
    "clinic|n.|診所|The clinic opens at nine.",
    "eligible|adj.|有資格的|You are eligible for the benefit.",
    "wellness|n.|健康|We have a wellness program."
  ],
  p5: [
    ["If I ___ you, I would take a day off.", ["am","was","were","be"], 2, "假設語氣 be 動詞一律用 were。"],
    ["If we had more staff, we ___ finish faster.", ["will","would","can","are"], 1, "與現在事實相反 → would + 原形。"],
    ["It is essential that every employee ___ the form.", ["submit","submits","submitted","submitting"], 0, "It is essential that + 主詞 + (should) 原形。"],
    ["Full-time staff are ___ for health insurance.", ["eligible","eligibility","eligibly","elect"], 0, "be + 形容詞；be eligible for。"],
    ["Please bring your ___ to the pharmacy.", ["prescribe","prescription","prescribed","prescriptive"], 1, "your 後接名詞。"]
  ],
  p2: [
    ["Does the plan cover dental care?", ["Yes, up to a limit.","I'll cover for you.","At the dentist."], 0],
    ["How do I file a claim?", ["Fill out the form online.","It's a fair claim.","By the file cabinet."], 0],
    ["Are you feeling better today?", ["Yes, much better, thanks.","It's better than yesterday's report.","I feel the cloth."], 0]
  ],
  talk: { title: "看診", role: "你身體不舒服，在診所跟醫生說明",
    turns: [
      ["What seems to be the problem today?", ["i have a headache and a sore throat", "i have a fever", "i don't feel well"], "描述症狀"],
      ["How long have you had these symptoms?", ["for about three days", "since monday", "for two days"], "持續多久"],
      ["I'll give you a prescription. Do you have health insurance?", ["yes here is my card", "yes i do", "yes here you are"], "有健保"],
      ["Take this medicine twice a day and get some rest.", ["thank you doctor", "okay thank you very much", "thanks i will"], "道謝"]
    ] } },

{ w: 22, phase: 4, theme: "活動與研討會", grammar: "分詞構句",
  tip: "省略相同主詞，主動用 V-ing、被動用 p.p.。例：Having finished the report, she left. / Founded in 1990, the company...",
  words: [
    "conference|n.|研討會|The conference is in Osaka.",
    "register|v.|報名|Register online by June 1.",
    "venue|n.|場地|The venue holds 500 people.",
    "keynote|n.|主題演講|The keynote speaker is a CEO.",
    "attendee|n.|與會者|Attendees will receive a badge.",
    "exhibit|n./v.|展覽|Visit our exhibit at booth 12.",
    "organize|v.|籌辦|She organized the event.",
    "workshop|n.|工作坊|The workshop starts at 2.",
    "sponsor|n./v.|贊助|The event is sponsored by ABC.",
    "refreshments|n.|茶點|Refreshments will be served."
  ],
  p5: [
    ["___ in 1990, the company now has 30 branches.", ["Found","Founded","Founding","To found"], 1, "公司「被創立」→ 被動分詞構句 p.p.。"],
    ["___ the report, Ms. Liu sent it to her boss.", ["Finish","Finished","Having finished","To finished"], 2, "先完成再寄 → Having + p.p.。"],
    ["All ___ must wear their name badges.", ["attend","attendees","attendance","attended"], 1, "需人的複數名詞。"],
    ["The seminar was ___ by a local bank.", ["sponsor","sponsored","sponsoring","sponsorship"], 1, "was + p.p. 被動。"],
    ["Light ___ will be served during the break.", ["refresh","refreshments","refreshing","refreshed"], 1, "refreshments 茶點（名詞）。"]
  ],
  p2: [
    ["How do I register for the conference?", ["Through our website.","At the cash register.","It was a great conference."], 0],
    ["Who's giving the keynote speech?", ["Dr. Patel from Oxford.","Keep the note.","It's in Hall A."], 0],
    ["Will lunch be provided?", ["Yes, a buffet in the main hall.","She provided it.","At noon yesterday."], 0]
  ],
  talk: { title: "研討會交流", role: "你在國際研討會與其他與會者交談",
    turns: [
      ["Hi, are you enjoying the conference?", ["yes the keynote speech was very interesting", "yes it's very interesting", "yes i learned a lot"], "說很有收穫"],
      ["Where are you from?", ["i'm from taiwan", "i am from taichung taiwan", "i come from taiwan"], "說來自台灣"],
      ["What field do you work in?", ["i work in the recycling industry", "i work in sustainability", "i'm in the recycling business"], "說產業"],
      ["Interesting! Here is my business card.", ["thank you here is mine", "thanks let's keep in touch", "nice to meet you here's my card"], "交換名片"]
    ] } },

{ w: 23, phase: 4, theme: "公告與公司政策", grammar: "倒裝與強調句型",
  tip: "否定副詞置首要倒裝：Only after..., Not only does..., Never have I...。TOEIC 也考 Should you have any questions, ...（= If you should have...）。",
  words: [
    "policy|n.|政策|Please read the new policy.",
    "announce|v.|宣布|The CEO announced a merger.",
    "comply|v.|遵守|All staff must comply with the rules.",
    "regulation|n.|規定|Safety regulations are strict.",
    "effective|adj.|生效的|The policy is effective May 1.",
    "mandatory|adj.|強制的|Training is mandatory.",
    "procedure|n.|程序|Follow the standard procedure.",
    "authorize|v.|授權|Only managers can authorize payments.",
    "notice|n.|通知|Employees received a notice.",
    "prohibit|v.|禁止|Smoking is prohibited."
  ],
  p5: [
    ["___ you have any questions, please contact HR.", ["If","Should","Would","Unless"], 1, "Should you have... = If you should have...（倒裝）。"],
    ["Not only ___ the price drop, but sales rose.", ["did","does","was","has"], 0, "Not only 置首倒裝，過去事件用 did。"],
    ["The new rule will be ___ from next Monday.", ["effect","effective","effectively","effectiveness"], 1, "be effective = 生效。"],
    ["All employees must ___ with safety regulations.", ["comply","compliance","compliant","complied"], 0, "must + 原形；comply with。"],
    ["Attendance at the training is ___.", ["mandate","mandatory","mandatorily","mandated to"], 1, "be + 形容詞。"]
  ],
  p2: [
    ["When does the new policy take effect?", ["Starting next month.","It had a big effect.","The policy manual."], 0],
    ["Is the safety training mandatory?", ["Yes, for all new staff.","It's very safe.","She trained there."], 0],
    ["Who authorized this payment?", ["The finance manager did.","It's an author.","Two hundred dollars."], 0]
  ],
  talk: { title: "宣布新政策", role: "你向團隊說明新的遠端工作政策",
    turns: [
      ["(Team member) What's this meeting about?", ["i want to announce a new remote work policy", "we have a new work from home policy", "i'd like to explain our new policy"], "說要宣布新政策"],
      ["When does it take effect?", ["it is effective from next month", "it starts on the first of next month", "starting next monday"], "說生效時間"],
      ["Is it mandatory to come to the office at all?", ["yes you must come in two days a week", "everyone must come to the office on tuesdays", "you need to come in twice a week"], "說明規則"],
      ["What if we have questions?", ["should you have any questions please contact hr", "please contact me or hr", "you can email me anytime"], "說有問題聯絡誰"]
    ] } },

{ w: 24, phase: 4, theme: "企業與經濟新聞", grammar: "易混淆字詞",
  tip: "affect(v.)/effect(n.)、rise(不及物)/raise(及物)、lie/lay、alike/likely、most/almost、each/every、among/between。",
  words: [
    "merger|n.|合併|The merger was announced today.",
    "acquire|v.|收購|They acquired a startup.",
    "expand|v.|擴張|We plan to expand overseas.",
    "economy|n.|經濟|The economy is growing.",
    "decline|v./n.|下降|Sales declined last quarter.",
    "investor|n.|投資者|Investors were pleased.",
    "quarter|n.|季度|Profits rose in the third quarter.",
    "sustainable|adj.|永續的|We focus on sustainable growth.",
    "forecast|n./v.|預測|The forecast is positive.",
    "significant|adj.|顯著的|There was a significant increase."
  ],
  p5: [
    ["The company will ___ prices next month.", ["rise","raise","arise","rose"], 1, "raise 及物（提高某物）；rise 不及物。"],
    ["The new law will ___ small businesses.", ["affect","effect","effective","affection"], 0, "affect 動詞＝影響。"],
    ["Sales ___ by 5 percent last quarter.", ["raised","rose","risen","raise"], 1, "無受詞 → rise 的過去式 rose。"],
    ["___ all employees attended the meeting.", ["Most","Almost","Mostly","The most"], 1, "almost all = 幾乎所有（almost 修飾 all）。"],
    ["There was a ___ increase in revenue.", ["significant","significance","signify","significantly"], 0, "名詞前用形容詞。"]
  ],
  p2: [
    ["Did you hear about the merger?", ["Yes, it was in the news.","I heard the music.","It's not mine."], 0],
    ["Why did the stock price fall?", ["Profits were lower than expected.","It fell in autumn.","In the stockroom."], 0],
    ["Are we expanding into Asia?", ["Yes, starting with Vietnam.","It's expensive.","He's an expert."], 0]
  ],
  talk: { title: "討論新聞", role: "同事和你聊財經新聞",
    turns: [
      ["Did you read about the merger between the two tech companies?", ["yes i read it this morning", "yes it was big news", "no what happened"], "回應"],
      ["How do you think it will affect our industry?", ["i think competition will increase", "it might affect our prices", "i think it will create more opportunities"], "表達看法"],
      ["Our sales declined last quarter. Should we be worried?", ["not really the forecast is positive", "i think we should focus on sustainable products", "we need a new strategy"], "提出觀點"],
      ["Good point. Let's discuss it at the next meeting.", ["sounds good", "sure i'll prepare some data", "great idea"], "回應"]
    ] } }
];

// 衝刺週（25–26）由程式自動彙整全部題庫
WEEKS.push(
  { w: 25, phase: 5, theme: "總複習：Part 5 文法大混戰", grammar: "全部文法重點", tip: "隨機抽 1–24 週所有 Part 5 題。目標：每題 20 秒內作答、正確率 80% 以上。", words: [], p5: [], p2: [], talk: null, review: true },
  { w: 26, phase: 5, theme: "模擬考週：聽讀全面衝刺", grammar: "考前策略", tip: "考前一週：維持作息、每天一回模擬、只複習錯題本，不再學新東西。", words: [], p5: [], p2: [], talk: null, review: true }
);

// 每日任務：完成 1 項就算今日達標，其餘是加分
const DAILY_PLAN = [
  { key: "vocab", icon: "🃏", name: "單字複習", min: 15, desc: "間隔重複記憶，每天新字 10 個" },
  { key: "speak", icon: "🎙️", name: "AI 口說對練", min: 10, desc: "角色扮演，對著麥克風說" },
  { key: "listen", icon: "🎧", name: "聽力 Part 2", min: 10, desc: "聽問句選最佳回應" },
  { key: "grammar", icon: "✏️", name: "文法 Part 5", min: 10, desc: "本週文法題＋解析" },
  { key: "shadow", icon: "🔁", name: "跟讀練習", min: 10, desc: "聽例句、模仿發音、評分" }
];

// 遊戲：每日猜字（5 個字母的多益常見字）
const WORDLE_WORDS = [
  "ORDER|訂單；訂購", "STAFF|員工", "SALES|銷售", "AGENT|代理人", "BOARD|董事會", "BRAND|品牌", "CLAIM|索賠；聲稱",
  "DRAFT|草稿", "EVENT|活動", "OFFER|提供；報價", "QUOTE|報價", "LEASE|租約", "LOBBY|大廳", "AUDIT|查帳",
  "BADGE|識別證", "BONUS|獎金", "BOOTH|攤位", "CHART|圖表", "CLERK|職員", "DELAY|延誤", "DEPOT|倉庫",
  "FIELD|領域", "FLOOR|樓層", "GOODS|貨物", "GUEST|客人", "GUIDE|指南", "HOTEL|飯店", "ISSUE|問題；發行",
  "LABEL|標籤", "LUNCH|午餐", "MERGE|合併", "MODEL|型號", "PANEL|小組；面板", "PRICE|價格", "PRINT|列印",
  "PRIZE|獎品", "PROOF|證明", "RAISE|加薪；提高", "RENEW|續約", "REPLY|回覆", "ROUTE|路線", "SCALE|規模",
  "SHARE|股份；分享", "SHELF|架子", "SHIFT|輪班", "SKILL|技能", "SPACE|空間", "SPEND|花費", "STOCK|庫存；股票",
  "STORE|商店", "SUITE|套房", "TERMS|條款", "TOTAL|總計", "TRACK|追蹤", "TRADE|貿易", "TRAIN|培訓",
  "TRUCK|卡車", "TRUST|信任", "VALID|有效的", "VALUE|價值", "VENUE|場地", "VISIT|拜訪", "WAGES|工資",
  "WASTE|廢棄物", "WORTH|值得的", "YIELD|產量", "CHAIR|主持；椅子", "COVER|涵蓋", "ENTRY|入口；參賽", "INPUT|意見；投入"
];
