package services

import (
	"fmt"
	"io"

	"github.com/Mahaveer86619/TrailStory/pkg/db"
	"github.com/Mahaveer86619/TrailStory/pkg/errz"
	"github.com/Mahaveer86619/TrailStory/pkg/middleware"
	"github.com/Mahaveer86619/TrailStory/pkg/models"
	"github.com/Mahaveer86619/TrailStory/pkg/services/storage"
	"github.com/Mahaveer86619/TrailStory/pkg/utils"
	"github.com/Mahaveer86619/TrailStory/pkg/views"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserService struct {
	DB      *gorm.DB
	Storage storage.StorageService
}

func NewUserService(storage storage.StorageService) *UserService {
	return &UserService{
		DB:      db.GetTrailStoryDB().DB,
		Storage: storage,
	}
}

func (s *UserService) RegisterUser(req views.RegisterRequest) (*views.AuthResponse, error) {
	var count int64
	s.DB.Model(&models.User{}).Where("email = ?", req.Email).Count(&count)
	if count > 0 {
		return nil, errz.New(errz.Conflict, "Email already registered", nil)
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errz.New(errz.InternalServerError, "Security error", err)
	}

	user := models.User{
		Email:        req.Email,
		DisplayName:  req.DisplayName,
		PasswordHash: string(hashedPassword),
	}

	if err := s.DB.Create(&user).Error; err != nil {
		return nil, errz.New(errz.InternalServerError, "Failed to create user", err)
	}

	token, refresh, err := middleware.GenerateTokens(user.ID)
	if err != nil {
		return nil, errz.New(errz.InternalServerError, "Failed to generate session", err)
	}

	return &views.AuthResponse{
		Token:        token,
		RefreshToken: refresh,
		User:         views.ToUserView(&user, s.Storage),
	}, nil
}

func (s *UserService) LoginUser(req views.LoginRequest) (*views.AuthResponse, error) {
	var user models.User
	if err := s.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		return nil, errz.New(errz.Unauthorized, "Invalid credentials", nil)
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		return nil, errz.New(errz.Unauthorized, "Invalid credentials", nil)
	}

	token, refresh, err := middleware.GenerateTokens(user.ID)
	if err != nil {
		return nil, errz.New(errz.InternalServerError, "Failed to generate session", err)
	}

	return &views.AuthResponse{
		Token:        token,
		RefreshToken: refresh,
		User:         views.ToUserView(&user, s.Storage),
	}, nil
}

func (s *UserService) RefreshToken(req views.RefreshRequest) (*views.AuthResponse, error) {
	userID, err := middleware.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		return nil, err // errz already handled in middleware
	}

	var user models.User
	if err := s.DB.First(&user, userID).Error; err != nil {
		return nil, errz.New(errz.Unauthorized, "User session invalid", err)
	}

	token, refresh, err := middleware.GenerateTokens(user.ID)
	if err != nil {
		return nil, errz.New(errz.InternalServerError, "Token rotation failed", err)
	}

	return &views.AuthResponse{
		Token:        token,
		RefreshToken: refresh,
		User:         views.ToUserView(&user, s.Storage),
	}, nil
}

func (s *UserService) GetUser(userID uint) (*views.UserView, error) {
	var user models.User
	if err := s.DB.First(&user, userID).Error; err != nil {
		return nil, errz.New(errz.NotFound, "User not found", err)
	}

	view := views.ToUserView(&user, s.Storage)
	return &view, nil
}

func (s *UserService) GetAllUsers() ([]views.UserView, error) {
	var users []*models.User
	if err := s.DB.Find(&users).Error; err != nil {
		return nil, errz.New(errz.InternalServerError, "Failed to fetch users", err)
	}

	resp := views.ToListUserView(users, s.Storage)
	return resp, nil
}

func (s *UserService) FollowUser(followerID uint, targetMaskedID string) error {
	targetID, err := utils.UnmaskID(targetMaskedID)
	if err != nil {
		return errz.New(errz.BadRequest, "Invalid user ID", err)
	}

	if followerID == targetID {
		return errz.New(errz.BadRequest, "You cannot follow yourself", nil)
	}

	// Check if target user exists
	var target models.User
	if err := s.DB.First(&target, targetID).Error; err != nil {
		return errz.New(errz.NotFound, "Target user not found", err)
	}

	// Create follow relationship
	follow := models.Following{
		FollowerID:  followerID,
		FollowingID: targetID,
	}

	if err := s.DB.Create(&follow).Error; err != nil {
		return errz.New(errz.Conflict, "You are already following this user", err)
	}

	return nil
}

func (s *UserService) UnfollowUser(followerID uint, targetMaskedID string) error {
	targetID, err := utils.UnmaskID(targetMaskedID)
	if err != nil {
		return errz.New(errz.BadRequest, "Invalid user ID", err)
	}

	result := s.DB.
		Where("follower_id = ? AND following_id = ?", followerID, targetID).
		Delete(&models.Following{}).
		Unscoped()
	if result.Error != nil {
		return errz.New(errz.InternalServerError, "Failed to unfollow", result.Error)
	}
	if result.RowsAffected == 0 {
		return errz.New(errz.NotFound, "Relationship not found", nil)
	}

	return nil
}

func (s *UserService) GetFollowers(userID uint) ([]views.UserView, error) {
	var followers []*models.User
	err := s.DB.Table("users").
		Joins("JOIN followings ON followings.follower_id = users.id").
		Where("followings.following_id = ?", userID).
		Find(&followers).Error

	if err != nil {
		return nil, errz.New(errz.InternalServerError, "Failed to fetch followers", err)
	}

	return views.ToListUserView(followers, s.Storage), nil
}

func (s *UserService) GetFollowing(userID uint) ([]views.UserView, error) {
	var following []*models.User
	err := s.DB.Table("users").
		Joins("JOIN followings ON followings.following_id = users.id").
		Where("followings.follower_id = ?", userID).
		Find(&following).Error

	if err != nil {
		return nil, errz.New(errz.InternalServerError, "Failed to fetch following list", err)
	}

	return views.ToListUserView(following, s.Storage), nil
}

func (s *UserService) UpdateUser(userID uint, req views.UpdateRequest) (*views.UserView, error) {
	var user models.User
	if err := s.DB.First(&user, userID).Error; err != nil {
		return nil, errz.New(errz.NotFound, "User not found", err)
	}

	user.DisplayName = req.DisplayName
	if err := s.DB.Save(&user).Error; err != nil {
		return nil, errz.New(errz.InternalServerError, "Update failed", err)
	}

	view := views.ToUserView(&user, s.Storage)
	return &view, nil
}

func (s *UserService) UploadProfilePic(userID uint, filename string, file io.Reader) (*views.UserView, error) {
	key, err := s.Storage.SaveProfilePic(fmt.Sprint(userID), filename, file)
	if err != nil {
		return nil, errz.New(errz.InternalServerError, "Failed to save image", err)
	}

	if err := s.DB.Model(&models.User{}).Where("id = ?", userID).Update("profile_pic", key).Error; err != nil {
		return nil, errz.New(errz.InternalServerError, "Failed to update user profile", err)
	}

	return s.GetUser(userID)
}

func (s *UserService) DeleteUser() error {
	if err := s.DB.Delete(&models.User{}).Unscoped().Error; err != nil {
		return errz.New(errz.InternalServerError, "Delete failed", err)
	}
	return nil
}
