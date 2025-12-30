package views

import (
	"errors"
	"time"

	"github.com/Mahaveer86619/TrailStory/pkg/models"
	"github.com/Mahaveer86619/TrailStory/pkg/services/storage"
	"github.com/Mahaveer86619/TrailStory/pkg/utils"
)

type UserView struct {
	ID          string    `json:"id"`
	Email       string    `json:"email"`
	DisplayName string    `json:"display_name"`
	ProfilePic  string    `json:"profile_pic_url"`
	CreatedAt   time.Time `json:"created_at"`
}

type AuthResponse struct {
	Token        string   `json:"token"`
	RefreshToken string   `json:"refresh_token"`
	User         UserView `json:"user"`
}

func ToUserView(u *models.User, storage storage.StorageService) UserView {
	url := ""
	if u.ProfilePic != "" {
		url = storage.GetPublicURL(u.ProfilePic)
	}

	return UserView{
		ID:          utils.MaskID(u.ID),
		Email:       u.Email,
		DisplayName: u.DisplayName,
		ProfilePic:  url,
		CreatedAt:   u.CreatedAt,
	}
}

func ToListUserView(u []*models.User, storage storage.StorageService) []UserView {
	var resp []UserView
	for _, user := range u {
		resp = append(resp, ToUserView(user, storage))
	}
	return resp
}

type RegisterRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"display_name"`
}

func (r RegisterRequest) Valid() error {
	if r.Email == "" {
		return errors.New("email cannot be empty")
	}
	if r.Password == "" {
		return errors.New("password cannot be empty")
	}
	if r.DisplayName == "" {
		return errors.New("display name cannot be empty")
	}

	return nil
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (r LoginRequest) Valid() error {
	if r.Email == "" {
		return errors.New("email cannot be empty")
	}
	if r.Password == "" {
		return errors.New("password cannot be empty")
	}

	return nil
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

func (r RefreshRequest) Valid() error {
	if r.RefreshToken == "" {
		return errors.New("refresh token is required")
	}
	return nil
}

type UpdateRequest struct {
	ID          string `json:"id"`
	DisplayName string `json:"display_name"`
}

func (r UpdateRequest) Valid() error {
	if r.ID == "" {
		return errors.New("id cannot be empty")
	}
	if r.DisplayName == "" {
		return errors.New("display name cannot be empty")
	}

	return nil
}
