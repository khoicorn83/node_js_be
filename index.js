import express from 'express'

import * as db from './database.js'

const app = express()
app.use(express.json())

//Lấy danh sách các dụng cụ
app.get("/my_project_db", async (req, res) => {
  const equipments = await db.getEquipments()
  res.send(equipments)
})

//Lấy dụng cụ bằng ID
app.get("/my_project_db/:id", async (req, res) => {
  const id = req.params.id
  const equipment = await db.getEquipmentById(id)
  res.send(equipment)
})

// API xử lý khi người dùng trộn hóa chất
app.post('/api/mix', async (req, res) => {
    // Nhận thêm catalyst từ body
    const { reactantIds, temperature, catalyst } = req.body;

    if (!reactantIds || reactantIds.length < 1) {
        return res.status(400).send({ message: "Thiếu hóa chất tham gia" });
    }

    try {
        // Truyền thêm catalyst vào hàm kiểm tra
        const reaction = await db.checkReaction(reactantIds, catalyst);

        if (reaction) {
            // Kiểm tra nhiệt độ
            if (reaction.OptimalTemperature && temperature < reaction.OptimalTemperature) {
                return res.send({ 
                    status: 'no_reaction', 
                    message: `Cần nhiệt độ cao hơn (khoảng ${reaction.OptimalTemperature}°C)` 
                });
            }

            res.send({
                status: 'success',
                data: reaction,
                effect: reaction.DescriptionVN
            });
        } else {
            res.send({ 
                status: 'no_reaction', 
                message: 'Không có phản ứng xảy ra (thiếu chất xúc tác hoặc sai hóa chất)' 
            });
        }
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

//Báo lỗi
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

app.listen(8080, () => {
  console.log('Server is running on port 8080')
})