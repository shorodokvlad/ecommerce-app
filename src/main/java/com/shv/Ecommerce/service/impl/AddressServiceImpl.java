package com.shv.Ecommerce.service.impl;

import com.shv.Ecommerce.dto.AddressDto;
import com.shv.Ecommerce.dto.Response;
import com.shv.Ecommerce.entity.Address;
import com.shv.Ecommerce.entity.User;
import com.shv.Ecommerce.repository.AddressRepo;
import com.shv.Ecommerce.service.interf.IAddressService;
import com.shv.Ecommerce.service.interf.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements IAddressService {
    private final AddressRepo addressRepo;
    private final IUserService userService;
    @Override
    public Response saveAndUpdateAddress(AddressDto addressDto) {
        User user = userService.getLoginUser();
        Address address = user.getAddress();

        if (address == null) {
            address = new Address();
            address.setUser(user);
        }

        if (addressDto.getStreet() != null) address.setStreet(addressDto.getStreet());
        if (addressDto.getCity() != null) address.setCity(addressDto.getCity());
        if (addressDto.getState() != null) address.setState(addressDto.getState());
        if (addressDto.getZipCode() != null) address.setZipCode(addressDto.getZipCode());
        if (addressDto.getCountry() != null) address.setCountry(addressDto.getCountry());

        addressRepo.save(address);

        String message = (user.getAddress() == null) ? "Address successfully created" : "Address successfully updated";

        return Response.builder()
                .status(200)
                .message(message)
                .build();
    }
}
