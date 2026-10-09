"""Dữ liệu mẫu cho DB dev: tài khoản hoa.ctp, công thức, lịch sử cân nặng, bữa ăn.

Chạy sau `alembic upgrade head` (cần danh mục nguyên liệu của migration 0002), từ thư mục src/backend:

    uv run python -m scripts.seed_dev

Mật khẩu lấy từ biến môi trường SEED_DEV_PASSWORD, mặc định "matkhau123".
Chỉ dùng cho dev, không chạy trên production. Tài khoản đã tồn tại thì bỏ qua, nên chạy lại không tạo trùng.
"""

import os

from dotenv import load_dotenv

_ = load_dotenv()

from argon2 import PasswordHasher
from psycopg2.extras import RealDictCursor

from app.db.database import connect, fetch_returned_id

USERNAME = "hoa.ctp"
DEFAULT_PASSWORD = "matkhau123"
DAILY_CALORIE_GOALS = 1800

# (tên, cách làm, [(product_nutrition_id, quantity theo đơn vị của định lượng)])
RECIPES = [
    (
        "Cơm ức gà áp chảo bông cải",
        "Ướp ức gà với muối, tiêu, áp chảo mỗi mặt 4-5 phút. Bông cải luộc 3 phút. Dùng với cơm trắng.",
        [(1, 200), (2, 150), (12, 100), (21, 0.01)],
    ),
    (
        "Cơm thịt kho trứng",
        "Thịt heo thái khối kho với nước mắm, đường, trứng luộc, đun lửa nhỏ 40 phút. Ăn với cơm.",
        [(1, 200), (3, 150), (7, 2), (27, 0.01), (26, 10)],
    ),
    (
        "Phở bò",
        "Chần bánh phở, xếp thịt bò thái mỏng, chan nước dùng hầm xương nóng.",
        [(10, 250), (4, 120)],
    ),
    (
        "Bún chả",
        "Thịt heo nướng than, ăn với bún, rau sống, cà rốt dưa leo ngâm chua ngọt và nước mắm pha.",
        [(9, 250), (3, 150), (15, 50), (14, 50), (26, 10), (27, 0.02)],
    ),
    (
        "Rau muống xào tỏi",
        "Xào nhanh rau muống với tỏi trên lửa lớn khoảng 2 phút.",
        [(11, 300), (21, 0.01), (32, 10)],
    ),
    (
        "Cá hồi áp chảo khoai lang",
        "Áp chảo cá hồi mỗi mặt 3-4 phút. Khoai lang hấp, bông cải luộc ăn kèm.",
        [(5, 150), (22, 200), (12, 100), (21, 0.005)],
    ),
    (
        "Trứng ốp la bánh mì",
        "Chiên trứng ốp la, ăn với bánh mì và cà chua tươi.",
        [(20, 1), (7, 2), (13, 50), (21, 0.005)],
    ),
    (
        "Yến mạch sữa chuối hạnh nhân",
        "Nấu yến mạch với sữa tươi 5 phút, thêm chuối và hạnh nhân.",
        [(19, 50), (18, 0.25), (30, 1), (25, 15)],
    ),
    (
        "Salad ức gà",
        "Luộc hoặc áp chảo ức gà xé nhỏ, trộn xà lách, cà chua, dưa leo, sốt dầu.",
        [(28, 150), (13, 100), (14, 100), (2, 150), (21, 0.01)],
    ),
    (
        "Cơm đậu hũ sốt cà chua",
        "Chiên vàng đậu hũ, xào cà chua đến sệt, cho đậu hũ vào rim 5 phút. Ăn với cơm.",
        [(1, 200), (8, 250), (13, 200), (21, 0.01)],
    ),
    (
        "Cơm tôm rang",
        "Rang tôm với nước mắm và đường đến thấm, ăn với cơm.",
        [(1, 200), (23, 150), (26, 5), (27, 0.01), (21, 0.01)],
    ),
    (
        "Sữa chua táo hạnh nhân",
        "Táo thái hạt lựu trộn sữa chua, rắc hạnh nhân.",
        [(24, 150), (31, 1), (25, 15)],
    ),
    (
        "Chuối",
        "Ăn trực tiếp 1 quả chuối.",
        [(30, 1)],
    ),
    (
        "Táo",
        "Ăn trực tiếp 1 quả táo.",
        [(31, 1)],
    ),
    (
        "Cơm cá basa kho",
        "Cá basa kho với nước mắm, đường đến sệt. Ăn với cơm.",
        [(1, 200), (6, 150), (27, 0.01), (26, 5)],
    ),
]

# (meal_type, eaten_at, [(tên công thức, portion)])
MEALS = [
    ("breakfast", "2026-10-08 07:30", [("Yến mạch sữa chuối hạnh nhân", 1)]),
    (
        "lunch",
        "2026-10-08 12:00",
        [("Cơm ức gà áp chảo bông cải", 1), ("Rau muống xào tỏi", 0.5)],
    ),
    ("snack", "2026-10-08 15:30", [("Chuối", 1)]),
    ("dinner", "2026-10-08 19:00", [("Phở bò", 1)]),
    ("breakfast", "2026-10-09 07:15", [("Trứng ốp la bánh mì", 1)]),
    ("lunch", "2026-10-09 12:15", [("Cơm cá basa kho", 1), ("Táo", 1)]),
]

# (weight_g, recorded_at)
HEALTH_RECORDS = [
    (62000, "2026-09-25 07:00"),
    (61500, "2026-10-02 07:00"),
    (61200, "2026-10-08 07:00"),
]


def seed(cursor: RealDictCursor) -> bool:
    cursor.execute("SELECT 1 FROM auths WHERE username = %s", (USERNAME,))
    if cursor.fetchone() is not None:
        return False

    latest_weight_g = max(HEALTH_RECORDS, key=lambda record: record[1])[0]
    cursor.execute(
        "INSERT INTO users (name, daily_calorie_goals, weight_g) VALUES (%s, %s, %s) RETURNING id",
        (USERNAME, DAILY_CALORIE_GOALS, latest_weight_g),
    )
    user_id = fetch_returned_id(cursor)
    cursor.execute(
        "INSERT INTO auths (username, password_hash, user_id) VALUES (%s, %s, %s)",
        (
            USERNAME,
            PasswordHasher().hash(
                os.environ.get("SEED_DEV_PASSWORD", DEFAULT_PASSWORD)
            ),
            user_id,
        ),
    )
    cursor.executemany(
        "INSERT INTO user_health_records (user_id, weight_g, recorded_at) VALUES (%s, %s, %s)",
        [(user_id, weight_g, recorded_at) for weight_g, recorded_at in HEALTH_RECORDS],
    )

    recipe_ids: dict[str, int] = {}
    for name, detail, items in RECIPES:
        cursor.execute(
            "INSERT INTO recipes (user_id, name, detail_recipe) VALUES (%s, %s, %s) RETURNING id",
            (user_id, name, detail),
        )
        recipe_ids[name] = fetch_returned_id(cursor)
        cursor.executemany(
            "INSERT INTO recipe_items (recipe_id, product_nutrition_id, quantity) VALUES (%s, %s, %s)",
            [
                (recipe_ids[name], nutrition_id, quantity)
                for nutrition_id, quantity in items
            ],
        )

    for meal_type, eaten_at, items in MEALS:
        cursor.execute(
            "INSERT INTO meals (user_id, meal_type, eaten_at) VALUES (%s, %s, %s) RETURNING id",
            (user_id, meal_type, eaten_at),
        )
        meal_id = fetch_returned_id(cursor)
        cursor.executemany(
            "INSERT INTO meal_items (meal_id, recipe_id, portion) VALUES (%s, %s, %s)",
            [
                (meal_id, recipe_ids[recipe_name], portion)
                for recipe_name, portion in items
            ],
        )
    return True


def main() -> None:
    print(
        f"seed_dev → {os.environ['DB_HOST']}:{os.environ.get('DB_PORT', '5432')}/{os.environ['DB_NAME']}"
    )
    conn = connect()
    try:
        with conn, conn.cursor(cursor_factory=RealDictCursor) as cursor:
            created = seed(cursor)
    finally:
        conn.close()
    if created:
        counts = f"{len(RECIPES)} công thức, {len(HEALTH_RECORDS)} lần cân, {len(MEALS)} bữa ăn"
        print(f"Đã tạo tài khoản {USERNAME}: {counts}.")
    else:
        print(f"Tài khoản {USERNAME} đã có, bỏ qua.")


if __name__ == "__main__":
    main()
