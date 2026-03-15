package com.shv.Ecommerce.service.interf;

import com.shv.Ecommerce.dto.AddressDto;
import com.shv.Ecommerce.dto.Response;

public interface IAddressService {
    Response saveAndUpdateAddress(AddressDto addressDto);
}
