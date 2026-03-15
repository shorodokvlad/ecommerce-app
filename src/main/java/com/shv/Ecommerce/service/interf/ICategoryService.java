package com.shv.Ecommerce.service.interf;

import com.shv.Ecommerce.dto.CategoryDto;
import com.shv.Ecommerce.dto.Response;

public interface ICategoryService {
    Response createCategory(CategoryDto categoryRequest);

    Response updateCategory(Long categoryId, CategoryDto categoryRequest);

    Response getAllCategories();

    Response getCategoryById(Long categoryId);

    Response deleteCategory(Long categoryId);

}
