CREATE TABLE IF NOT EXISTS household_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('communication','insurance','warranty','software_service')),
  owner TEXT,
  provider TEXT,
  amount REAL,
  currency TEXT NOT NULL DEFAULT 'JPY',
  billing_cycle TEXT NOT NULL DEFAULT 'none' CHECK (billing_cycle IN ('monthly','yearly','one_time','none')),
  start_date TEXT,
  end_date TEXT,
  next_renewal_date TEXT,
  reminder_days INTEGER NOT NULL DEFAULT 30,
  auto_renew INTEGER NOT NULL DEFAULT 0,
  account_note TEXT,
  contract_number TEXT,
  serial_number TEXT,
  website TEXT,
  tags TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','ended')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_household_items_category ON household_items(category);
CREATE INDEX IF NOT EXISTS idx_household_items_end_date ON household_items(end_date);
CREATE INDEX IF NOT EXISTS idx_household_items_next_renewal ON household_items(next_renewal_date);
CREATE INDEX IF NOT EXISTS idx_household_items_status ON household_items(status);

INSERT INTO household_items
(name, category, owner, provider, amount, currency, billing_cycle, start_date, end_date, next_renewal_date, reminder_days, auto_renew, notes)
VALUES
('我的手机','communication','我','docomo',4980,'JPY','monthly',date('now'),NULL,date('now','+1 month'),7,1,'示例数据，可修改或删除'),
('媳妇手机','communication','媳妇','',3980,'JPY','monthly',date('now'),NULL,date('now','+1 month'),7,1,'示例数据，可修改或删除'),
('家庭光纤','communication','家庭','',5200,'JPY','monthly',date('now'),NULL,date('now','+1 month'),14,1,'示例数据，可修改或删除'),
('汽车保险','insurance','家庭','',NULL,'JPY','none',NULL,'2027-03-31',NULL,30,0,'示例数据'),
('火灾保险','insurance','家庭','',NULL,'JPY','none',NULL,'2028-06-30',NULL,60,0,'示例数据'),
('iPad','warranty','家庭','Apple',NULL,'JPY','none',date('now'),date('now','+428 day'),NULL,30,0,'示例数据'),
('洗衣机','warranty','家庭','',NULL,'JPY','none',date('now'),date('now','+92 day'),NULL,30,0,'示例数据'),
('Microsoft 365','software_service','家庭','Microsoft',NULL,'JPY','yearly',NULL,NULL,NULL,30,1,'填写真实费用与续费日'),
('ChatGPT Plus','software_service','我','OpenAI',NULL,'JPY','monthly',NULL,NULL,NULL,7,1,'填写真实费用与续费日'),
('VPS','software_service','我','',NULL,'JPY','monthly',NULL,NULL,NULL,7,1,'可为不同 VPS 建多条记录'),
('域名','software_service','家庭','',NULL,'JPY','yearly',NULL,NULL,NULL,30,1,'建议填写域名到期日'),
('Cloudflare','software_service','家庭','Cloudflare',NULL,'JPY','none',NULL,NULL,NULL,30,0,'可记录付费服务与域名相关信息');
