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

            const reactionProducts = await db.getReactionProducts(reaction.ReactionID)
            res.send({
                status: 'success',
                data: reactionProducts,
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

// API Kiểm tra kết quả cân bằng phương trình
app.post('/api/check-balance', async (req, res) => {
    const { reactionId, userCoefficients } = req.body; 
    // userCoefficients nên là mảng số, ví dụ: [2, 1, 2]

    if (!reactionId || !Array.isArray(userCoefficients)) {
        return res.status(400).send({ message: "Dữ liệu đầu vào không hợp lệ" });
    }

    try {
        // 1. Lấy dãy hệ số chuẩn từ Database (đã sắp xếp theo DisplayOrder)
        const correctCoefficients = await db.getCorrectCoefficientsOrdered(reactionId);

        if (correctCoefficients.length === 0) {
            return res.status(404).send({ message: "Không tìm thấy phản ứng này" });
        }

        // 2. Kiểm tra độ dài mảng
        if (correctCoefficients.length !== userCoefficients.length) {
            return res.send({
                status: 'error',
                message: 'Số lượng hệ số bạn nhập không khớp với phương trình'
            });
        }

        // 3. So sánh từng hệ số (sử dụng == để linh hoạt kiểu dữ liệu string/number)
        const isCorrect = correctCoefficients.every((val, index) => val == userCoefficients[index]);

        if (isCorrect) {
            res.send({
                status: 'success',
                message: 'Chính xác! Bạn đã hoàn thành phương trình.',
                // Bạn có thể trả về thêm điểm thưởng hoặc EXP tại đây
            });
        } else {
            res.send({
                status: 'incorrect',
                message: 'Hệ số chưa đúng, hãy thử kiểm tra lại!'
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