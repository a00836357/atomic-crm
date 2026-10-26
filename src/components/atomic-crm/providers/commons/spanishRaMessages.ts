import type { TranslationMessages } from "ra-core";

// The published ra-language-spanish package targets react-admin v3, so the
// react-admin and ra-supabase catalogs are translated here.
export const spanishRaMessages: TranslationMessages = {
  ra: {
    action: {
      add_filter: "Agregar filtro",
      add: "Agregar",
      back: "Regresar",
      bulk_actions:
        "1 elemento seleccionado |||| %{smart_count} elementos seleccionados",
      cancel: "Cancelar",
      clear_array_input: "Vaciar la lista",
      clear_input_value: "Borrar valor",
      clone: "Duplicar",
      confirm: "Confirmar",
      create: "Crear",
      create_item: "Crear %{item}",
      delete: "Eliminar",
      edit: "Editar",
      export: "Exportar",
      list: "Lista",
      refresh: "Actualizar",
      remove_filter: "Quitar este filtro",
      remove_all_filters: "Quitar todos los filtros",
      remove: "Quitar",
      reset: "Restablecer",
      save: "Guardar",
      search: "Buscar",
      search_columns: "Buscar columnas",
      select_all: "Seleccionar todo",
      select_all_button: "Seleccionar todo",
      select_row: "Seleccionar esta fila",
      show: "Ver",
      sort: "Ordenar",
      undo: "Deshacer",
      unselect: "Deseleccionar",
      expand: "Expandir",
      close: "Cerrar",
      open_menu: "Abrir menú",
      close_menu: "Cerrar menú",
      update: "Actualizar",
      move_up: "Subir",
      move_down: "Bajar",
      open: "Abrir",
      toggle_theme: "Cambiar modo claro/oscuro",
      select_columns: "Columnas",
      update_application: "Recargar la aplicación",
    },
    boolean: {
      true: "Sí",
      false: "No",
      null: " ",
    },
    page: {
      create: "Crear %{name}",
      dashboard: "Inicio",
      edit: "%{name} %{recordRepresentation}",
      error: "Algo salió mal",
      list: "%{name}",
      loading: "Cargando",
      not_found: "No encontrado",
      show: "%{name} %{recordRepresentation}",
      empty: "Aún no hay %{name}.",
      invite: "¿Quieres agregar uno?",
      access_denied: "Acceso denegado",
      authentication_error: "Error de autenticación",
    },
    input: {
      file: {
        upload_several:
          "Arrastra archivos para subirlos, o da clic para elegir uno.",
        upload_single:
          "Arrastra un archivo para subirlo, o da clic para elegirlo.",
      },
      image: {
        upload_several:
          "Arrastra imágenes para subirlas, o da clic para elegir una.",
        upload_single:
          "Arrastra una imagen para subirla, o da clic para elegirla.",
      },
      references: {
        all_missing: "No se encontraron los datos relacionados.",
        many_missing:
          "Al menos uno de los registros relacionados ya no está disponible.",
        single_missing: "El registro relacionado ya no está disponible.",
      },
      password: {
        toggle_visible: "Ocultar contraseña",
        toggle_hidden: "Mostrar contraseña",
      },
    },
    message: {
      about: "Acerca de",
      access_denied: "No tienes permiso para ver esta página",
      are_you_sure: "¿Estás seguro?",
      authentication_error:
        "El servidor de autenticación devolvió un error y no se pudieron validar tus credenciales.",
      auth_error: "Ocurrió un error al validar el token de autenticación.",
      bulk_delete_content:
        "¿Seguro que quieres eliminar este %{name}? |||| ¿Seguro que quieres eliminar estos %{smart_count} elementos?",
      bulk_delete_title:
        "Eliminar %{name} |||| Eliminar %{smart_count} %{name}",
      bulk_update_content:
        "¿Seguro que quieres actualizar %{name} %{recordRepresentation}? |||| ¿Seguro que quieres actualizar estos %{smart_count} elementos?",
      bulk_update_title:
        "Actualizar %{name} %{recordRepresentation} |||| Actualizar %{smart_count} %{name}",
      clear_array_input: "¿Seguro que quieres vaciar toda la lista?",
      delete_content: "¿Seguro que quieres eliminar este %{name}?",
      delete_title: "Eliminar %{name} %{recordRepresentation}",
      details: "Detalles",
      error: "Ocurrió un error y no se pudo completar tu solicitud.",
      invalid_form: "El formulario no es válido. Revisa los errores",
      loading: "Espera un momento",
      no: "No",
      not_found: "La dirección es incorrecta o el enlace no es válido.",
      select_all_limit_reached:
        "Hay demasiados elementos para seleccionarlos todos. Solo se seleccionaron los primeros %{max}.",
      unsaved_changes:
        "Algunos cambios no se guardaron. ¿Seguro que quieres descartarlos?",
      yes: "Sí",
      placeholder_data_warning:
        "Problema de red: no se pudieron actualizar los datos.",
    },
    navigation: {
      clear_filters: "Quitar filtros",
      no_filtered_results:
        "No se encontraron %{name} con los filtros actuales.",
      no_results: "No se encontraron %{name}",
      no_more_results:
        "La página %{page} está fuera de rango. Prueba la página anterior.",
      page_out_of_boundaries: "La página %{page} está fuera de rango",
      page_out_from_end: "No hay páginas después de la última",
      page_out_from_begin: "No hay páginas antes de la 1",
      page_range_info: "%{offsetBegin}-%{offsetEnd} de %{total}",
      partial_page_range_info:
        "%{offsetBegin}-%{offsetEnd} de más de %{offsetEnd}",
      current_page: "Página %{page}",
      page: "Ir a la página %{page}",
      first: "Ir a la primera página",
      last: "Ir a la última página",
      next: "Ir a la página siguiente",
      previous: "Ir a la página anterior",
      page_rows_per_page: "Filas por página:",
      skip_nav: "Saltar al contenido",
    },
    sort: {
      sort_by: "Ordenar por %{field_lower_first} %{order}",
      ASC: "ascendente",
      DESC: "descendente",
    },
    auth: {
      auth_check_error: "Inicia sesión para continuar",
      user_menu: "Perfil",
      username: "Usuario",
      password: "Contraseña",
      email: "Correo",
      sign_in: "Iniciar sesión",
      sign_in_error: "No se pudo iniciar sesión, inténtalo de nuevo",
      logout: "Cerrar sesión",
    },
    notification: {
      updated:
        "Elemento actualizado |||| %{smart_count} elementos actualizados",
      created: "Elemento creado",
      deleted: "Elemento eliminado |||| %{smart_count} elementos eliminados",
      bad_item: "Elemento incorrecto",
      item_doesnt_exist: "El elemento no existe",
      http_error: "Error de comunicación con el servidor",
      data_provider_error:
        "Error del dataProvider. Revisa la consola para más detalles.",
      i18n_error: "No se pudieron cargar las traducciones del idioma elegido",
      canceled: "Acción cancelada",
      logged_out: "Tu sesión terminó, vuelve a iniciar sesión.",
      not_authorized: "No tienes permiso para acceder a este recurso.",
      application_update_available: "Hay una versión nueva disponible.",
      offline: "Sin conexión. No se pudieron obtener los datos.",
    },
    validation: {
      required: "Obligatorio",
      minLength: "Debe tener al menos %{min} caracteres",
      maxLength: "Debe tener %{max} caracteres o menos",
      minValue: "Debe ser al menos %{min}",
      maxValue: "Debe ser %{max} o menos",
      number: "Debe ser un número",
      email: "Debe ser un correo válido",
      oneOf: "Debe ser uno de: %{options}",
      regex: "Debe cumplir un formato específico (regexp): %{pattern}",
      unique: "Debe ser único",
    },
    saved_queries: {
      label: "Búsquedas guardadas",
      query_name: "Nombre de la búsqueda",
      new_label: "Guardar búsqueda actual...",
      new_dialog_title: "Guardar búsqueda actual como",
      remove_label: "Quitar búsqueda guardada",
      remove_label_with_name: 'Quitar búsqueda "%{name}"',
      remove_dialog_title: "¿Quitar búsqueda guardada?",
      remove_message:
        "¿Seguro que quieres quitar este elemento de tus búsquedas guardadas?",
      help: "Filtra la lista y guarda esta búsqueda para después",
    },
    guesser: {
      empty: {
        title: "No hay datos que mostrar",
        message: "Revisa tu proveedor de datos",
      },
    },
    configurable: {
      customize: "Personalizar",
      configureMode: "Configurar esta página",
      inspector: {
        title: "Inspector",
        content: "Pasa el cursor sobre la interfaz para configurarla",
        reset: "Restablecer ajustes",
        hideAll: "Ocultar todo",
        showAll: "Mostrar todo",
      },
      Datagrid: {
        title: "Tabla",
        unlabeled: "Columna sin nombre #%{column}",
      },
      SimpleForm: {
        title: "Formulario",
        unlabeled: "Campo sin nombre #%{input}",
      },
      SimpleList: {
        title: "Lista",
        primaryText: "Texto principal",
        secondaryText: "Texto secundario",
        tertiaryText: "Texto terciario",
      },
    },
  },
  "ra-supabase": {
    auth: {
      email: "Correo",
      confirm_password: "Confirmar contraseña",
      sign_in_with: "Iniciar sesión con %{provider}",
      forgot_password: "¿Olvidaste tu contraseña?",
      reset_password: "Restablecer contraseña",
      password_reset:
        "Revisa tu correo: te enviamos un mensaje para restablecer tu contraseña.",
      missing_tokens: "Faltan los tokens de acceso y de actualización",
      back_to_login: "Volver a iniciar sesión",
    },
    reset_password: {
      forgot_password: "¿Olvidaste tu contraseña?",
      forgot_password_details: "Escribe tu correo para recibir instrucciones.",
    },
    set_password: {
      new_password: "Elige tu contraseña",
    },
    validation: {
      password_mismatch: "Las contraseñas no coinciden",
    },
    oauth: {
      authorize: "Autorizar aplicación",
      authorize_details: "Esta aplicación quiere acceder a tu cuenta.",
      access_scope:
        "Podrá leer y modificar tus datos, con los mismos permisos que tu cuenta.",
      approved: "Autorización aprobada",
      close_tab: "Ya puedes cerrar esta pestaña.",
      no_request: "No se encontró ninguna solicitud de autorización",
    },
  },
};
