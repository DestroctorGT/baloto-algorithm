// src/schemas/create-user.schema.ts
import * as yup from 'yup'

export const createUserSchema = yup.object().shape({
  userName: yup.string().required('El nombre de usuario es obligatorio').min(4, 'El nombre de usuario deber tener como mínimo 4 caracteres'),
  email: yup.string().required('El correo electrónico es requerido').email('Tiene que ser un correo valido'),
  password: yup.string().required('La contraseña es obligatoria').matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm, 'La contraseña tiene que tener como mínimo 8 caracteres, 1 letra en mayúscula, minúscula, 1 numero y caracteres especiales')
})
