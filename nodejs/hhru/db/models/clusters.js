import { query } from '../../helpers/sql.js'

const cs = {} // Reusable ColumnSet objects.

/** Clusters Manager
 */
class ClustersManager {
    constructor(db, pgp) {
        this.db = db
        this.pgp = pgp
        createColumnsets(pgp)
    }

    // 1. Returns all cluster records or cluster records by query
    async find(c) {
        return this.db.any(
            query.select, {
                tableName: cs.select.table,
                fields: cs.select.names,
                filterExp: JSON.stringify(c) === '{}' ? '' : this.pgp.as.format('where $1:name = $1:csv', [c])
            }
        )
    }

    // 2. Tries to find a cluster by id
    async findById(id) {
        return this.db.oneOrNone(query.select, {
            tableName: cs.select.table,
            fields: cs.select.names,
            filterExp: this.pgp.as.format('where id = $1', [+id])
        })
    }

    // 3. Adds a new cluster and returns the full object
    async add(c) {
        return this.db.one(
            query.insert, {
                tableName: cs.insert.table,
                values: {
                    name: c.name,
                    type: c.type,
                    url: c.url,
                    cnt: c.cnt
                },
                returnExp: 'returning *'
            }
        )
    }

    // 4. Tries to delete a cluster by id, and returns the number of records deleted
    async remove(id) {
        return this.db.result(
            query.delete, {
                tableName: cs.select.table,
                filterExp: this.pgp.as.format('where id = $1', [+id])
            },
            r => r.rowCount
        )
    }

    // 5. Returns the total number of clusters
    async total() {
        return this.db.one(
            query.select, {
                tableName: cs.select.table,
                fields: 'count(*)',
                filterExp: ''
            },
            a => +a.count
        )
    }

    // Removes all records from the table
    async emptyTable() {
        return this.db.none(query.truncate, { tableName: cs.select.table })
    }

    // DDL. Creates the clusters table
    async createTable() {
        return this.db.none(query.createClustersTable)
    }

    // DDL. Drops the clusters table
    async dropTable() {
        return this.db.none(query.drop, { tableName: cs.select.table })
    }
}

/** 
 * Statically initializing ColumnSet objects
 * @param {*} pgp 
 */
function createColumnsets(pgp) {
    if (!cs.insert) {
        const table = new pgp.helpers.TableName({ table: 'clusters', schema: 'public' })
        cs.insert = new pgp.helpers.ColumnSet(['name', 'type', 'url', 'cnt'], { table })
        cs.update = cs.insert.extend(['?id'])
        cs.select = cs.update
    }
    return cs;
}

export default ClustersManager