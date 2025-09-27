package com.ck.quiz.menu.repository;

import com.ck.quiz.menu.entity.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 菜单数据访问接口
 */
@Repository
public interface MenuRepository extends JpaRepository<Menu, String> {

    /**
     * 根据菜单名称查找菜单
     */
    Optional<Menu> findByMenuName(String menuName);

    /**
     * 统计指定父菜单下的子菜单数量
     */
    long countByParentId(String parentId);

}