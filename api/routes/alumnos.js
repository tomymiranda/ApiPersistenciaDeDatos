var express = require("express");
var router = express.Router();
var models = require("../models");

router.get("/", (req, res,next) => {

  const cantidadAVisualizar = parseInt(req.query.cantidadAVisualizar);
  const paginaActual = parseInt(req.query.paginaActual);

  models.alumno
  .findAndCountAll({
    attributes: ["id","nombre","edad","id_carrera"],
    include:[{as:'Carrera-Relacionada', model:models.carrera, attributes: ["id","nombre"]}],
    order: [["id", "ASC"]],
    offset: (paginaActual-1) * cantidadAVisualizar, 
    limit: cantidadAVisualizar
    }).then(alumnos => res.send(alumnos))
    .catch(error => { return next(error)});
});

router.post("/", (req, res) => {
    models.alumno
      .create({ nombre: req.body.nombre,edad: req.body.edad ,id_carrera: req.body.id_carrera })
      .then(alumno => res.status(201).send({ id: alumno.id }))
      .catch(error => {
        if (error == "SequelizeUniqueConstraintError: Validation error") {
          res.status(400).send('Bad request: existe otro alumno con el mismo nombre')
        }
        else {
          console.log(`Error al intentar insertar en la base de datos: ${error}`)
          res.sendStatus(500)
        }
      });
  });
    
  const findAlumno = (id, { onSuccess, onNotFound, onError }) => {
    models.alumno
      .findOne({
        attributes: ["id", "nombre","edad","id_carrera"],
        include:[{as:'Carrera-Relacionada', model:models.carrera, attributes: ["id","nombre"]}],
        where: { id }
      })
      .then(alumno => (alumno ? onSuccess(alumno) : onNotFound()))
      .catch(() => onError());
  };
  
  router.get("/:id", (req, res) => {
    findAlumno(req.params.id, {
      onSuccess: alumno => res.send(alumno),
      onNotFound: () => res.sendStatus(404),
      onError: () => res.sendStatus(500)
    });
  });
  
  router.put("/:id", (req, res) => {
    const onSuccess = alumno =>
    alumno
        .update({ nombre: req.body.nombre, edad:req.body.edad }, { fields: ["nombre","edad"] })
        .then(() => res.sendStatus(200))
        .catch(error => {
        if (error == "SequelizeUniqueConstraintError: Validation error") {
          res.status(400).send('Bad request: existe otro alumno con el mismo nombre')
          }
        else {
          console.log(`Error al intentar actualizar la base de datos: ${error}`)
          res.sendStatus(500)
        }
      });
      findAlumno(req.params.id, {
      onSuccess,
      onNotFound: () => res.sendStatus(404),
      onError: () => res.sendStatus(500)
    });
  });
  router.delete("/:id", (req, res) => {
    const onSuccess = alumno =>
    alumno
        .destroy()
        .then(() => res.sendStatus(200))
        .catch(() => res.sendStatus(500));
        findAlumno(req.params.id, {
      onSuccess,
      onNotFound: () => res.sendStatus(404),
      onError: () => res.sendStatus(500)
    });
    
  });

module.exports = router;