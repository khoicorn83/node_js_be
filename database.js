import mysql from 'mysql2'

import dotenv from 'dotenv'
dotenv.config()

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise()

//Lấy danh sách tất cả các dụng cụ
export async function getEquipments() {
    const [rows] = await pool.query("SELECT * FROM equipments")
    return rows
}

//Lấy danh sách tất cả các hoá chất
export async function getChemicals() {
    const [rows] = await pool.query("SELECT * FROM chemicals");
    return rows;
}

//Lấy dụng cụ bằng ID
export async function getEquipmentById(id) {
    const [rows] = await pool.query(`
        SELECT * FROM equipments 
        WHERE EquipmentID = ?
    `, [id]) 
    
    return rows[0]
}

/// Kiểm tra phản ứng gồm: danh sách hóa chất và chất xúc tác
export async function checkReaction(reactantIds, catalyst) {
    const sortedIds = reactantIds.sort((a, b) => a - b);
    
    // Câu lệnh SQL kiểm tra đúng các chất tham gia và đúng chất xúc tác
    const [rows] = await pool.query(`
        SELECT r.* FROM reactions r
        JOIN reactionschemicals rc ON r.ReactionID = rc.ReactionID
        WHERE rc.Role = 'reactant'
        AND (r.Required_Conditions IS NULL OR r.Required_Conditions = ?)
        GROUP BY r.ReactionID
        HAVING COUNT(rc.ChemicalID) = ? 
        AND MIN(rc.ChemicalID IN (?)) = 1
    `, [catalyst || null, sortedIds.length, sortedIds]);

    return rows[0];
}

// Lấy danh sách sản phẩm dựa trên ID Reaction
export async function getReactionProducts(reactionId) {
    try {
        // Câu lệnh SQL kết nối bảng trung gian và bảng hóa chất để lấy thông tin chi tiết
        const [rows] = await pool.query(`
            SELECT 
                c.ChemicalID, 
                c.Formula, 
                c.NameVN, 
                rc.HeSo, 
                c.Color, 
                c.PhysicalState
            FROM reactionschemicals rc
            JOIN chemicals c ON rc.ChemicalID = c.ChemicalID
            WHERE rc.ReactionID = ? AND rc.Role = 'Product'
        `, [reactionId]);

        // Trả về danh sách các hàng dữ liệu tìm thấy
        return rows;
    } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm:", error);
        throw error;
    }
}