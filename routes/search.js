const express = require('express')
const router = express.Router()
// Include isAuthenticated module
const { isAuthenticated } = require('../config/auth')
// Include models
const db = require('../models')
const Todo = db.Todo
// Include date converter
const { convertDate } = require('../date-converter')
// Include sequelize operator
const Op = require('sequelize').Op

router.get('/', isAuthenticated, (req, res) => {
  // retrieve data user selected
  const selectedSort = req.query.sort || req.query.preSort
  const selectedStatus = req.query.done || req.query.preDone
  const selectedDueDate = req.query.date || req.query.preDate
  // get criteria
  const sort = selectedSort === 'Name' ? 'name'
    : selectedSort === 'Status' ? 'done'
      : 'dueDate'
  const status = selectedStatus === 'Done' ? true
    : selectedStatus === 'Undone' ? false
      : ''
  const dueDate = selectedDueDate ? { [Op.eq]: new Date(selectedDueDate) } : { [Op.gte]: new Date('2019-01-01') }

  // Filter option for all unique date
  const dateOptions = []

  Todo.findAll({
    attributes: ['dueDate'],
    where: { UserId: req.user.id },
    group: ['dueDate']
  })
    .then(allDate => {
      allDate.forEach(date => dateOptions.push(convertDate(date.dataValues.dueDate)))
      return Todo.findAll({
        where: {
          UserId: req.user.id,
          done: { [Op.or]: [status][0] === '' ? [true, false] : [status] },
          dueDate
        },
        order: [[sort, 'DESC']]
      })
    })
    .then(todos => {
      // convert all displayed date
      todos.forEach(todo => { todo.dataValues.dueDate = convertDate(todo.dataValues.dueDate) })
      return res.render('index', {
        todos,
        indexCSS: true,
        dateOptions,
        filter: { sort: selectedSort, status: selectedStatus, dueDate: selectedDueDate }
      })
    })
    .catch(error => res.status(422).json(error))
})


module.exports = router