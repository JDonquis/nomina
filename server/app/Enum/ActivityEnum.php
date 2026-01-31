<?php

namespace App\Enums;

enum ActivityEnum: string
{
    case CENSUS_CREATED = 'Creacion de Censo';
    case CENSUS_UPDATED = 'Actualizacion de Censo';
    case CENSUS_DELETED = 'Eliminacion de Censo';
    case PAYSHEET_CREATED = 'Creacion de registro';
    case PAYSHEET_UPDATED = 'PAYSHEET_UPDATED';
    case PAYSHEET_DELETED = 'PAYSHEET_DELETED';
    case USER_LOGIN = 'USER_LOGIN';
    case USER_LOGOUT = 'USER_LOGOUT';
    case USER_CREATED = 'USER_CREATED';
    case USER_UPDATED = 'USER_UPDATED';
}
