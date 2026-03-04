

## Plan: Generate sample products with photos

Insert sample tulip products into the `products` table across all 3 categories (букеты, штучные, композиции) using the database insert tool. Each product will have a name, description, price, category, and a photo URL from Unsplash (free, no attribution required for hotlinking).

**Products to create (9 total, 3 per category):**

**Букеты:**
- Весенний поцелуй — 25 тюльпанов, 3500₽
- Нежность — 15 розовых тюльпанов, 2200₽
- Солнечный день — 11 жёлтых тюльпанов, 1800₽

**Штучные:**
- Красный тюльпан — 1 шт, 250₽
- Белый тюльпан — 1 шт, 200₽
- Фиолетовый тюльпан — 1 шт, 280₽

**Композиции:**
- Весенняя корзина — тюльпаны в плетёной корзине, 4500₽
- Цветочный бокс — тюльпаны в шляпной коробке, 5200₽
- Романтический сад — микс тюльпанов с зеленью, 3800₽

**Implementation:** Single SQL INSERT via the data insert tool. Photos will use Unsplash image URLs. All products set as `in_stock: true`. No code changes needed — existing Catalog and AdminProducts pages will display them automatically.

