"""
测试数据种子脚本 - 习惯分类功能测试
运行方式: python seed_test_data.py
确保后端服务已在 localhost:8000 运行
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def p(msg): print(f"\n{'='*50}\n{msg}\n{'='*50}")

# 1. 注册测试用户
p("1. 注册测试用户")
res = requests.post(f"{BASE_URL}/register", json={
    "username": "testuser",
    "password": "testpass123",
    "email": "test@example.com"
})
print(f"状态: {res.status_code}")
if res.status_code != 200:
    print("注册失败，尝试直接登录...")
    res = requests.post(f"{BASE_URL}/login", json={
        "username": "testuser",
        "password": "testpass123"
    })
    print(f"登录状态: {res.status_code}")

token = "Bearer " + res.json()["token"]
headers = {"token": token}
print(f"Token 获取成功")

# 2. 创建分类
p("2. 创建习惯分类")
categories = ["健身运动", "学习成长", "生活习惯"]
category_ids = {}

for name in categories:
    res = requests.post(f"{BASE_URL}/add_category", json={"category_name": name}, headers=headers)
    print(f"  [{res.status_code}] 分类: {name}")
    if res.status_code == 200:
        data = res.json()
        category_ids[name] = data["category_id"]
        print(f"         ID: {data['category_id']}")

# 3. 获取所有分类
p("3. 获取所有分类")
res = requests.get(f"{BASE_URL}/get_categories", headers=headers)
print(f"状态: {res.status_code}")
print(json.dumps(res.json(), ensure_ascii=False, indent=2))

# 4. 创建带分类的习惯
p("4. 创建习惯（绑定分类）")
habits = [
    {"habit_name": "每天跑步30分钟", "habit_desc": "保持有氧运动，增强体能", "reset_at": [0], "category": "健身运动"},
    {"habit_name": "每天做俯卧撑", "habit_desc": "上肢力量训练，每天50个", "reset_at": [0], "category": "健身运动"},
    {"habit_name": "每天读书1小时", "habit_desc": "阅读技术书籍或文学作品", "reset_at": [0], "category": "学习成长"},
    {"habit_name": "学习英语单词", "habit_desc": "每天背20个新单词", "reset_at": [0], "category": "学习成长"},
    {"habit_name": "早睡早起", "habit_desc": "23点前睡觉，7点前起床", "reset_at": [0], "category": "生活习惯"},
    {"habit_name": "喝够8杯水", "habit_desc": "每天保持充足水分摄入", "reset_at": [0], "category": "生活习惯"},
    {"habit_name": "冥想10分钟", "habit_desc": "每天冥想放松心情", "reset_at": [0], "category": None},  # 无分类
]

for h in habits:
    cat_id = category_ids.get(h["category"]) if h["category"] else None
    res = requests.post(f"{BASE_URL}/add_habit", json={
        "habit_name": h["habit_name"],
        "habit_desc": h["habit_desc"],
        "reset_at": h["reset_at"],
        "category_id": cat_id
    }, headers=headers)
    cat_label = h["category"] or "无分类"
    print(f"  [{res.status_code}] {h['habit_name']} -> {cat_label}")

# 5. 按分类查询习惯
p("5. 按分类查询习惯")
for name, cat_id in category_ids.items():
    res = requests.get(f"{BASE_URL}/get_habits_by_category?category_id={cat_id}", headers=headers)
    habits_in_cat = res.json()
    print(f"\n  [{name}] ({len(habits_in_cat)} 个习惯):")
    for h in habits_in_cat:
        print(f"    - {h['habit_name']}")

# 查询无分类习惯
res = requests.get(f"{BASE_URL}/get_habits_by_category", headers=headers)
print(f"\n  [无分类] ({len(res.json())} 个习惯):")
for h in res.json():
    print(f"    - {h['habit_name']}")

# 查询全部习惯
res = requests.get(f"{BASE_URL}/get_habits_by_category?category_id=all", headers=headers)
print(f"\n  [全部] 共 {len(res.json())} 个习惯")

p("✅ 测试数据插入完成！")
print("现在可以在前端测试分类功能了")
print(f"测试账号: testuser / testpass123")
