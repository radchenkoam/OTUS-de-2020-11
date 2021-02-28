import moment from 'moment'
import { query } from '../../helpers/sql.js'

const cs = {} // Reusable ColumnSet objects.

/** Vacancies Manager
 */
class VacanciesManager {
    constructor(db, pgp) {
        this.db = db
        this.pgp = pgp
        createColumnsets(pgp)
    }

    // 1. Returns all vacancy records or recordset by query
    async find(v) {
        return this.db.any(
            query.select, 
            {
                tableName: cs.select.table, 
                fields: cs.select.names, 
                filterExp: JSON.stringify(v) === '{}' ? '' : this.pgp.as.format('where $1:name = $1:csv', [v])
            }
        )
    }

    // 2. Tries to find a vacancy by id
    async findById(id) {
        return this.db.oneOrNone(query.select, { 
            tableName: cs.select.table, 
            fields: cs.select.names, 
            filterExp: this.pgp.as.format('where id = $1', [+id])
        })
    }
    
    // 3. Adds a new vacancy, and returns the new object
    async add(v) {
        return this.db.one(
            query.insert, 
            {
                tableName: cs.insert.table, 
                values: { 
                    id: v.id,
                    name: v.name,
                    area: v.area,
                    salary: v.salary,
                    type: v.type,
                    experience: v.experience,
                    schedule: v.schedule,
                    employment: v.employment,
                    description: v.description,
                    key_skills: v.key_skills,
                    employer: v.employer,
                    published_at: v.published_at,
                    created_at: v.created_at || moment(new Date()).utc()
                },
                returnExp: 'returning *'
            }
        )
    }

    // 4. Tries to delete a vacancy by id, and returns the number of records deleted
    async remove(id) {
        return this.db.result(
            query.delete, 
            { 
                tableName: cs.select.table, 
                filterExp: this.pgp.as.format('where id = $1', [+id])
            }, 
            r => r.rowCount
        )
    }

    // 5. Returns the total number of vacancies
    async total() {
        return this.db.one(
            query.select, 
            {
                tableName: cs.select.table, 
                fields: 'count(*)' , 
                filterExp: '' 
            }, 
            a => +a.count
        )
    }

    // Removes all records from the table
    async emptyTable() {
        return this.db.none(query.truncate, { tableName: cs.select.table })
    }

    // DDL. Creates the Vacancies table
    async createTable() {
        return this.db.none(query.createVacanciesTable)
    }

    // DDL. Drops the Vacancies table
    async dropTable() {
        return this.db.none(query.drop, { tableName: cs.select.table })
    }
}

/** Statically initializing ColumnSet objects
 * 
 * @param {*} pgp 
 */
function createColumnsets(pgp) {
    if (!cs.insert) {
        const table = new pgp.helpers.TableName({table: 'vacancies', schema: 'public'})
        cs.insert = new pgp.helpers.ColumnSet([
            'id', 'name', 'area', 'salary', 'type', 
            'experience', 'schedule', 'employment', 
            'description', 'key_skills', 'employer', 
            'published_at', 'created_at'
        ], {table})
        cs.update = cs.insert
        cs.select = cs.update
    }
    return cs;
}

export default VacanciesManager