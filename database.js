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