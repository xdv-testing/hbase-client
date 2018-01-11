const mock = require('./mock.json')
const assert = require('assert')
const Hbase = require('../src/index.js')

const HbaseRest = require('hbase')

const hbase = new Hbase({
  hosts: ['hbase'],
  root: '/hbase',
  prefix: 'prefix',
  logLevel: 3
})

describe('hbase client', function() {

  it('should delete existing table', function(done) {
    this.timeout(5000)
    
    const rest = HbaseRest({ host: 'hbase', port: 8080 })
    
    rest.table('prefixtest').delete((err) => {
        assert.ifError(err)
        done()
    })
  })
  
  it('should create a table', function(done) {
    this.timeout(5000)
    
    const rest = HbaseRest({ host: 'hbase', port: 8080 })
    
    rest.table('prefixtest').create({
        ColumnSchema: [
          { name: 'f'},
          { name: 'd'}
        ]
      }, (err, resp) => {
        assert.ifError(err)
        done()
    })
  })

  it('should save a single row', function() {
    return hbase.putRow(mock.row)
    .then(() => {
      return hbase.getRow({
        table: mock.row.table,
        rowkey: mock.row.rowkey
      })      
    }).then(row => {
      assert.strictEqual(row.rowkey, mock.row.rowkey)
      assert.deepEqual(row.columns, mock.row.columns)
    })    
  })

  it('should save a single row with column families', function() {
    return hbase.putRow(mock.rowWithColumnFamilies)
    .then(() => {
      return hbase.getRow({
        table: mock.rowWithColumnFamilies.table,
        rowkey: mock.rowWithColumnFamilies.rowkey,
        includeFamilies: true
      })      
    }).then(row => {
      assert.strictEqual(row.rowkey, mock.rowWithColumnFamilies.rowkey)
      assert.deepEqual(row.columns, mock.rowWithColumnFamilies.columns)
    })
  })

  it('should save a multiple rows', function() {
    return hbase.putRows(mock.rows)
    .then(() => {
      return hbase.getRows({
        table: mock.rows.table,
        rowkeys: Object.keys(mock.rows.rows)
      })
      .then(rows => {
        assert.strictEqual(rows.length, 4)
        assert.strictEqual(rows[0].columns.column0, mock.rows.rows['ROW|3'].column0.toString())
        assert.strictEqual(rows[0].columns.column1, mock.rows.rows['ROW|3'].column1.toString())
        assert.strictEqual(rows[0].columns.column2, mock.rows.rows['ROW|3'].column2)
        assert.strictEqual(rows[0].columns['columnJSON'], 
                           JSON.stringify(mock.rows.rows['ROW|3'].columnJSON))
      })
    })
  })

  it('should get a row by key', function() {
    return hbase.getRow({
      table: mock.row.table,
      rowkey: mock.row.rowkey
    })
    .then(row => {
      assert.strictEqual(row.rowkey, mock.row.rowkey)
      assert.deepEqual(row.columns, mock.row.columns)
    })
  })

  it('should get a row by key with specific columns', function() {
    return hbase.getRow({
      table: mock.row.table,
      rowkey: mock.row.rowkey,
      columns: ['d:baz']
    })
    .then(row => {
      assert.strictEqual(row.rowkey, mock.row.rowkey)
      assert.deepEqual(row.columns, {
        baz: mock.row.columns.baz
      })
    })
  })

  it('should get a row by key with column families', function() {
    return hbase.getRow({
      table: mock.rowWithColumnFamilies.table,
      rowkey: mock.rowWithColumnFamilies.rowkey,
      includeFamilies: true
    })
    .then(row => {
      assert.strictEqual(row.rowkey, mock.rowWithColumnFamilies.rowkey)
      assert.deepEqual(row.columns, mock.rowWithColumnFamilies.columns)
    })
  })
  
  
  it('should get multiple rows by key', function() {
    return hbase.getRows({
      table: mock.row.table,
      rowkeys: [
        'ROW|1',
        'ROW|2',
        'ROW|3',
        'ROW|4'
      ]
    })
    .then(rows => {
      assert.strictEqual(rows.length, 4)
    })
  })

  it('should get multiple rows by key with column families', function() {
    return hbase.getRows({
      table: mock.row.table,
      rowkeys: [
        'ROW|1',
        'ROW|2',
        'ROW|3',
        'ROW|4'
      ],
      includeFamilies: true
    })
    .then(rows => {
      assert.strictEqual(rows.length, 4)
      assert.strictEqual(rows[3].columns['d:column5'], '5')
    })
  })

  it('should get multiple rows by key with specific columns', function() {
    return hbase.getRows({
      table: mock.row.table,
      rowkeys: [
        'ROW|1',
        'ROW|2',
        'ROW|3',
        'ROW|4'
      ],
      columns: ['d:foo']
    })
    .then(rows => {
      assert.strictEqual(rows.length, 2)
    })
  })


  it('should get rows by scan', function() {
    return hbase.getScan({
      table: 'test'
    }).then(resp => {
      assert.strictEqual(resp.rows.length, 6)
      assert.strictEqual(resp.rows[0].rowkey, 'ROW|1')
    })
  })

  it('should get rows by scan with limit', function() {
    return hbase.getScan({
      table: 'test',
      limit: 2
    }).then(resp => {
      assert.strictEqual(resp.rows.length, 2)
      assert.strictEqual(resp.marker, 'ROW|3')
    })
  })
  
  it('should get rows by scan with start row', function() {
    return hbase.getScan({
      table: 'test',
      startRow: 'ROW|2'
    }).then(resp => {
      assert.strictEqual(resp.rows[0].rowkey, 'ROW|2')
      assert.strictEqual(resp.rows.length, 5)
      assert.strictEqual(resp.marker, undefined)
    })
  })  
  
  it('should get rows by scan with stop row', function() {
    return hbase.getScan({
      table: 'test',
      stopRow: 'ROW|4'
    }).then(resp => {
      assert.strictEqual(resp.rows[0].rowkey, 'ROW|1')
      assert.strictEqual(resp.rows.length, 3)
      assert.strictEqual(resp.marker, undefined)
    })
  })  
  
  it('should get rows by scan with start row and stop row', function() {
    return hbase.getScan({
      table: 'test',
      startRow: 'ROW|3',
      stopRow: 'ROW|5'
    }).then(resp => {
      assert.strictEqual(resp.rows[0].rowkey, 'ROW|3')
      assert.strictEqual(resp.rows.length, 2)
      assert.strictEqual(resp.marker, undefined)
    })
  })  
  
  it('should get rows by scan with start row and stop row (switch)', function() {
    return hbase.getScan({
      table: 'test',
      startRow: 'ROW|5',
      stopRow: 'ROW|3'
    }).then(resp => {
      assert.strictEqual(resp.rows[0].rowkey, 'ROW|3')
      assert.strictEqual(resp.rows.length, 2)
      assert.strictEqual(resp.marker, undefined)
    })
  })    

  it('should get rows by scan with marker', function() {
    return hbase.getScan({
      table: 'test',
      limit: 1,
      marker: 'ROW|3'
    }).then(resp => {
      assert.strictEqual(resp.rows.length, 1)
      assert.strictEqual(resp.rows[0].rowkey, 'ROW|3')
      assert.strictEqual(resp.marker, 'ROW|4')
    })
  })
  
  it('should get rows by scan with start row and stop row and marker', function() {
    return hbase.getScan({
      table: 'test',
      startRow: 'ROW|2',
      stopRow: 'ROW|6',
      marker: 'ROW|4'
    }).then(resp => {
      assert.strictEqual(resp.rows[0].rowkey, 'ROW|4')
      assert.strictEqual(resp.rows.length, 2)
      assert.strictEqual(resp.marker, undefined)
    })
  })    

  it('should get rows by scan (reversed)', function() {
    return hbase.getScan({
      table: 'test',
      descending: true
    }).then(resp => {
      assert.strictEqual(resp.rows.length, 6)
      assert.strictEqual(resp.rows[0].rowkey, 'ROW|6')
    })
  })
  
  it('should get rows by scan (reversed) with limit', function() {
    return hbase.getScan({
      table: 'test',
      descending: true,
      limit: 2
    }).then(resp => {
      assert.strictEqual(resp.rows.length, 2)
      assert.strictEqual(resp.rows[0].rowkey, 'ROW|6')
      assert.strictEqual(resp.marker, 'ROW|4')
    })
  })  
  
  it('should get rows by scan with startRow (reversed)', function() {
    return hbase.getScan({
      table: 'test',
      descending: true,
      startRow: 'ROW|1',
      stopRow: 'ROW|6'
    }).then(resp => {
      assert.strictEqual(resp.rows.length, 5)
      assert.strictEqual(resp.rows[0].rowkey, 'ROW|6')
    })
  })  
  
  it('should get rows by scan with startRow (reversed) with limit', function() {
    return hbase.getScan({
      table: 'test',
      descending: true,
      startRow: 'ROW|1',
      stopRow: 'ROW|5',
      limit: 2,
    }).then(resp => {
      assert.strictEqual(resp.rows.length, 2)
      assert.strictEqual(resp.rows[0].rowkey, 'ROW|5')
      assert.strictEqual(resp.marker, 'ROW|3')
    })
  }) 
  
  it('should get rows by scan with start row and stop row (switch, reverse)', function() {
    return hbase.getScan({
      table: 'test',
      startRow: 'ROW|3',
      stopRow: 'ROW|5',
      descending: true
    }).then(resp => {
      assert.strictEqual(resp.rows[0].rowkey, 'ROW|5')
      assert.strictEqual(resp.rows.length, 2)
      assert.strictEqual(resp.marker, undefined)
    })
  })   
  
  it('should get rows by scan with filters', function() {
    return hbase.getScan({
      table: 'test',
      filters: [mock.filter1]
    }).then(resp => {      
      const column = mock.filter1.qualifier
      const value = mock.filter1.value
      
      assert.strictEqual(resp.rows.length, 2)
      assert.strictEqual(resp.rows[0].columns[column], value)
      assert.strictEqual(resp.rows[1].columns[column], value)
    })
  })  

  it('should do a of scans, puts, and gets', function() {
    this.timeout(7000)
    let i = 300
    const list = []
    while (i--) {

      list.push(hbase.putRow(mock.row))
      list.push(hbase.getRow({
        table: mock.row.table,
        rowkey: mock.row.rowkey
      }))
      
      list.push(hbase.getRows({
        table: mock.rows.table,
        rowkeys: Object.keys(mock.rows.rows)
      }))

      list.push(hbase.getScan({
        table: 'test',
        startRow: 'A',
        stopRow: 'Z',
        descending: true
      }))
    }

    return Promise.all(list)
  })

  it('should delete a column', function() {
    return hbase.deleteColumn({
      table: 'test',
      rowkey: 'ROW|1',
      column: 'd:foo'
    }).then(() => {
      return hbase.getRow({
        table: 'test',
        rowkey: 'ROW|1'
      })
      .then(row => {
        assert.strictEqual(row.columns.foo, undefined)  
      })
    })
  })

  it('should delete columns', function() {
  
    
    return hbase.deleteColumns({
      table: 'test',
      rowkey: mock.rowWithColumnFamilies.rowkey,
      columns: Object.keys(mock.rowWithColumnFamilies.columns)
    })
    .then(() => {
      return hbase.getRow({
        table: 'test',
        rowkey: mock.rowWithColumnFamilies.rowkey
      })
      .then(row => {
        assert.strictEqual(row, undefined)  
      })      
    })
  })

  it('should delete a row', function() {
    return hbase.deleteRow({
      table: 'test',
      rowkey: 'ROW|1'
    })
  })

  it('should delete rows', function() {
    return hbase.deleteRows({
      table: 'test',
      rowkeys: ['ROW|2', 'ROW|3']
    })
  })

  it('should save a single row while removing empty columns', function() {
    mock.row.removeEmptyColumns = true
    mock.row.columns.foo = ''
 
    return hbase.putRow(mock.row)
    .then(() => {
      return hbase.getRow({
        table: mock.row.table,
        rowkey: mock.row.rowkey
      })
      .then(row => {
        assert.strictEqual(row.columns.foo, undefined)
        assert.strictEqual(row.columns.baz, 'foo')
      })
    })   
  }) 
  
  it('should save multiple rows while removing empty columns', function() {
    mock.rows.removeEmptyColumns = true
    mock.rows.rows['ROW|3'].column1 = ''
    mock.rows.rows['ROW|4'].column6 = ''
 
    return hbase.putRows(mock.rows)
    .then(() => {
      return hbase.getRows({
        table: mock.rows.table,
        rowkeys: ['ROW|3', 'ROW|4']
      })
      .then(rows => {
        assert.strictEqual(rows[0].columns.column1, undefined)
        assert.strictEqual(rows[0].columns.column2, 'two')
        assert.strictEqual(rows[1].columns.column6, undefined)
        assert.strictEqual(rows[1].columns.column5, '5')
      })
    })   
  }) 

  it('putRows should not error with an empty rowset', function() {
    return hbase.putRows({
      table: mock.rows.table,
      rows: {}
    })
  })  
})
